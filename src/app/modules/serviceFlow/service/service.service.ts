import { status } from "http-status";
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose, { model, PipelineStage } from "mongoose";
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { Service } from "./service.model";
import { IService, IsServiceCompleted, Status } from "./service.interface";

import { StripeService } from "../../stripe/stripe.service";

import User from "../../users/user/user.model";
import AppError from "../../../errors/AppError";

import { getSocket } from "../../../socket/socket";
import Payment from "../../stripe/payment.model";
import { PaymentStatus } from "../../stripe/payment.interface";

import { MechanicProfile } from "../../users/mechanicProfile/mechanicProfile.model";
import { stripe } from "../../stripe/stripe";
import { decrypt } from "../../../utils/helper/encrypt&decrypt";
import logger from "../../../utils/logger";
import { BidStatus } from "../bid/bid.interface";
import { Bid } from "../bid/bid.model";

//------------------------for users--------------------------//

const addServiceReq = async (
  serviceData: {
    issue: string;
    description: string;
    location: {
      placeId: string;
      coordinates: number[];
    };
    schedule?: {
      date: Date;
    };
  },
  userId: string
): Promise<IService> => {
  const location = {
    placeId: serviceData.location.placeId,
    coordinates: {
      type: "Point",
      coordinates: serviceData.location.coordinates,
    },
  };

  const today = new Date();
  // Set time range for today (start and end)
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));

  const isScheduled = !!serviceData.schedule?.date;

  // 1. If this is a scheduled request, check if there's already a scheduled service today
  // if (isScheduled) {
  //   const existingScheduled = await Service.findOne({
  //     user: userId,
  //     status: { $in: [Status.FINDING, Status.WORKING, Status.WAITING] },
  //     "schedule.isSchedule": true,
  //     createdAt: { $gte: startOfDay, $lte: endOfDay },
  //   });

  //   if (existingScheduled) {
  //     throw new Error("You already have a scheduled service request today.");
  //   }
  // }
  // // 2. If this is an unscheduled request, check if there's already an unscheduled service today
  // else {
  //   const existingUnscheduled = await Service.findOne({
  //     user: userId,
  //     status: { $in: [Status.FINDING, Status.WORKING, Status.WAITING] },
  //     "schedule.isSchedule": false,
  //     createdAt: { $gte: startOfDay, $lte: endOfDay },
  //   });

  //   if (existingUnscheduled) {
  //     throw new Error("You already have an unscheduled service request today.");
  //   }
  // }

  // If no conflict, create the new service

  const service = await Service.create({
    issue: serviceData.issue,
    description: serviceData.description,
    user: userId,
    location,
    ...(isScheduled
      ? {
          schedule: {
            isSchedule: true,
            date: serviceData.schedule!.date,
          },
        }
      : {
          // For unscheduled, rely on default: { isSchedule: false, date: null }
        }),
  });

  const io = getSocket();
  // socket-emit
  io.emit("new-service", { serviceId: service._id });

  return service;
};

const checkServiceStatusFinding = async (userId: string) => {
  const services = await Service.find({
    user: userId,
    status: Status.FINDING,
  });

  const immediateService = services.filter((s) => !s.schedule?.isSchedule);
  const scheduledService = services.filter((s) => s.schedule?.isSchedule);

  return { immediateService, scheduledService };
};

const getBidListOfService = async (serviceId: string, userId: string) => {
  const service = await Service.findOne({
    _id: serviceId,

    user: userId,
  }).lean();

  if (!service) {
    throw new AppError(status.NOT_FOUND, " Service not found.");
  }

  if (service && service.status !== Status.FINDING) {
    throw new AppError(
      status.BAD_REQUEST,
      `Service is already in  ${service.status}  `
    );
  }
  if (!service.location?.coordinates) {
    throw new AppError(status.BAD_REQUEST, " missing location");
  }

  const bids = await Bid.aggregate([
    { $match: { reqServiceId: service._id } },

    {
      $lookup: {
        from: "services",
        localField: "reqServiceId",
        foreignField: "_id",
        as: "service",
      },
    },
    { $unwind: "$service" },
    // Step 1: Join Mechanic Profile
    {
      $lookup: {
        from: "mechanicprofiles",
        localField: "mechanicId",
        foreignField: "user",
        as: "mechanicProfile",
      },
    },
    { $unwind: "$mechanicProfile" },

    // Step 2: Join Mechanic Ratings (all ratings of that mechanic)

    {
      $lookup: {
        from: "mechanicratings",
        localField: "mechanicId",
        foreignField: "mechanicId",
        as: "ratingDocs",
      },
    },

    // Step 3: Calculate average rating and count
    {
      $addFields: {
        averageRating: {
          $cond: [
            { $gt: [{ $size: "$ratingDocs" }, 0] },
            {
              $avg: "$ratingDocs.rating",
            },
            0,
          ],
        },
        totalReviews: { $size: "$ratingDocs" },
      },
    },

    // Step 4: Project only needed fields
    {
      $project: {
        "service.schedule": 1,
        "service._id": 1,
        price: 1,
        status: 1,
        mechanicId: 1,
        averageRating: { $round: ["$averageRating", 1] },
        totalReviews: 1,
        location: 1,
        "mechanicProfile.fullName": 1,
        "mechanicProfile.image": 1,
        "mechanicProfile.email": 1,
        "mechanicProfile.workshop.name": 1,
        "mechanicProfile.workshop.location.placeId": 1,
        "mechanicProfile.workshop.location.coordinates":
          "$mechanicProfile.workshop.location.coordinates.coordinates",
      },
    },
  ]);

  // Step 5: Add distance in Node.js (still more efficient this way)
  return bids.map(
    (bid: { location: { coordinates: { coordinates: any } } }) => {
      const coords = bid.location?.coordinates?.coordinates;

      const distance = coords
        ? calculateDistance(
            service.location.coordinates.coordinates as [number, number],
            coords
          )
        : null;

      return {
        ...bid,

        distance:
          distance || distance === 0 ? parseFloat(distance.toFixed(2)) : null,
      };
    }
  );
};

const hireMechanic = async (data: { bidId: string }, userId: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const bidData = await Bid.findOne({
      _id: data.bidId,
      status: BidStatus.provided,
    }).session(session);

    if (!bidData) {
      throw new AppError(status.NOT_FOUND, "Bid data not found");
    }

    const isServiceExist = await Service.findOne({
      _id: bidData.reqServiceId,
      user: userId,
    }).session(session);

    if (!isServiceExist) {
      throw new AppError(status.NOT_FOUND, "Service not found.");
    }

    if (
      isServiceExist.status === Status.WAITING ||
      isServiceExist.status === Status.COMPLETED ||
      isServiceExist.status === Status.CANCELLED ||
      isServiceExist.status === Status.WORKING
    ) {
      throw new AppError(
        status.BAD_REQUEST,
        `Service status is ${isServiceExist.status}`
      );
    }

    const userMechanic = await MechanicProfile.findOne({
      user: bidData.mechanicId,
    }).session(session);

    if (!userMechanic) {
      throw new AppError(status.NOT_FOUND, "Mechanic profile not found.");
    }

    const extraPrice = bidData.extraWork?.price || 0;
    const totalPrice = Number(bidData.price) + Number(extraPrice);

    const payment = await Payment.create(
      [
        {
          amount: totalPrice,
          bidId: bidData._id,
          serviceId: isServiceExist._id,
          mechanicId: bidData.mechanicId,
          status: PaymentStatus.UNPAID,
          user: isServiceExist.user,
        },
      ],
      { session }
    );

    isServiceExist.bidId = bidData._id;
    isServiceExist.status = Status.WAITING;
    await isServiceExist.save({ session });

    await session.commitTransaction();
    session.endSession();

    //! Socket need------------------------------------------------

    return payment[0]; // create returns an array
  } catch (err: any) {
    await session.abortTransaction();
    session.endSession();
    throw new Error(err);
  }
};
const markServiceAsComplete = async (pId: string) => {
  const paymentData = await Payment.findOne({
    _id: pId,
    status: PaymentStatus.UNPAID,
  });
  if (!paymentData) {
    throw new AppError(status.NOT_FOUND, "Payment data not found.");
  }
  const totalCost =
    (paymentData?.amount || 0) + (paymentData?.extraAmount || 0);

  if (totalCost === 0) {
    throw new AppError(status.BAD_REQUEST, "Total amount can't be zero.");
  }

  const mechanicData = await MechanicProfile.findOne({
    user: paymentData.mechanicId,
  });

  if (!mechanicData) {
    throw new AppError(status.NOT_FOUND, "Mechanic profile not found.");
  }

  if (paymentData.status === PaymentStatus.UNPAID) {
    const stripeIntent = await stripe.paymentIntents.retrieve(
      paymentData.txId
    );

    if (
      [
        "requires_payment_method",
        "requires_confirmation",
        "requires_action",
        "processing",
      ].includes(stripeIntent.status)
    ) {
      return {
        paymentIntent: stripeIntent.client_secret,
      };
    }


  await StripeService.createPaymentIntent({
    accountId: mechanicData.stripeAccountId,
    bidId: String(paymentData.bidId),
    serviceId: String(paymentData.serviceId),
    price: totalCost,
    userId: String(paymentData.user),
  });
};
//-----------------------common----------------------------
const getRunningService = async (userId: string) => {
  const activeStatuses = [Status.WORKING, Status.WAITING, Status.COMPLETED];

  const userData = await User.findById(userId).lean();
  if (userData && userData.role === "USER") {
    const serviceData = await Service.aggregate([
      {
        $match: {
          status: { $in: activeStatuses },
          user: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $lookup: {
          from: "payments",
          let: { serviceId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$serviceId", "$$serviceId"] },
              },
            },
            {
              $lookup: {
                from: "bids",
                let: { bidId: "$bidId" },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ["$_id", "$$bidId"] },
                    },
                  },
                  {
                    $project: {
                      _id: 1,
                      mechanicId: 1,
                      price: 1,
                    },
                  },
                ],
                as: "bid",
              },
            },
            {
              $unwind: "$bid",
            },
            {
              $lookup: {
                from: "users",
                let: { mechanicId: "$bid.mechanicId" },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ["$_id", "$$mechanicId"] },
                    },
                  },
                  {
                    $lookup: {
                      from: "mechanicprofiles",
                      let: { userId: "$_id" },
                      pipeline: [
                        {
                          $match: {
                            $expr: { $eq: ["$user", "$$userId"] },
                          },
                        },
                        {
                          $project: {
                            _id: 0,
                            location: 0,
                            workshop: 0,
                            experience: 0,
                            certificates: 0,
                            createdAt: 0,
                            updatedAt: 0,
                            __v: 0,
                          },
                        },
                      ],
                      as: "profileData",
                    },
                  },
                  {
                    $unwind: {
                      path: "$profileData",
                      preserveNullAndEmptyArrays: true,
                    },
                  },
                  {
                    $project: {
                      _id: 0,
                      role: 1,
                      profileData: 1,
                    },
                  },
                ],
                as: "mechanic",
              },
            },
            {
              $unwind: "$mechanic",
            },
            {
              $project: {
                _id: 1,
                bidId: "$bid._id",
                price: "$bid.price",
                mechanic: 1,
              },
            },
          ],
          as: "paymentData",
        },
      },
      {
        $unwind: "$paymentData",
      },
      {
        $project: {
          _id: 1,
          issue: 1,
          description: 1,
          user: 1,
          schedule: 1,
          status: 1,

          bidData: {
            bidId: "$paymentData.bidId",
            price: "$paymentData.price",
          },
          profile: "$paymentData.mechanic",
          paymentId: "$paymentData._id",
        },
      },
    ]);

    if (serviceData.length === 0) {
      throw new Error("Service not found");
    }

    return serviceData;
  } else if (userData && userData?.role === "MECHANIC") {
    const serviceData = await Service.aggregate([
      {
        $match: {
          status: { $in: activeStatuses },
        },
      },
      {
        $lookup: {
          from: "payments",
          localField: "_id",
          foreignField: "serviceId",
          pipeline: [
            {
              $lookup: {
                from: "bids",
                localField: "bidId",
                foreignField: "_id",
                pipeline: [
                  {
                    $match: { mechanicId: new mongoose.Types.ObjectId(userId) },
                  },
                ],
                as: "bidData",
              },
            },
            { $unwind: "$bidData" },
          ],
          as: "paymentData",
        },
      },

      {
        $unwind: {
          path: "$paymentData",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          pipeline: [
            {
              $lookup: {
                from: "userprofiles",
                localField: "_id",
                foreignField: "user",
                pipeline: [
                  {
                    $project: {
                      createdAt: 0,
                      updatedAt: 0,
                      carInfo: 0,
                      dateOfBirth: 0,
                      location: 0,
                      __v: 0,
                    },
                  },
                ],
                as: "profileData",
              },
            },
            { $unwind: "$profileData" },
            {
              $project: {
                _id: 0, // if you don't need user _id
                role: 1, // keep from user collection
                profileData: 1,
              },
            },
          ],
          as: "profile",
        },
      },
      { $unwind: "$profile" },
      {
        $project: {
          _id: 1,
          issue: 1,
          description: 1,
          user: 1,
          schedule: 1,
          status: 1,
          bidData: {
            bidId: "$paymentData.bidId",
            price: "$paymentData.bidData.price",
          },
          profile: 1,
          paymentId: "$paymentData._id",
        },
      },
    ]);

    if (serviceData.length === 0) {
      throw new Error("Service not found");
    }

    return serviceData;
  }
  throw new AppError(status.NOT_FOUND, "No active service found.");
};
const cancelService = async (
  pId: string,
  serviceData: { cancelReson: string }
): Promise<IService> => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const paymentData = await Payment.findOne({ _id: pId });

    if (!paymentData || !paymentData.txId) {
      throw new AppError(status.NOT_FOUND, "Payment data not found");
    }

    // 2. Find the related bid inside the transaction
    const bid = await Bid.findOne({ _id: paymentData?.bidId }).session(session);

    if (!bid) {
      throw new Error("Bid data not found");
    }

    const service = await Service.findByIdAndUpdate(
      paymentData?.serviceId,
      { ...serviceData, status: Status.CANCELLED },
      {
        new: true,
        session,
      }
    );

    if (!service) {
      throw new Error("Service not found");
    }

    paymentData.status = PaymentStatus.REFUNDED;
    await paymentData.save({ session });

    const io = getSocket();
    io.emit("cencel", { paymentId: pId });

    await session.commitTransaction();
    session.endSession();

    return service;
  } catch (error) {
    // Rollback on error
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};
const seeCurrentServiceProgress = async (pId: string) => {
  const serviceData = await Payment.findOne({ _id: pId })
    .populate({
      path: "serviceId",
      select: " -updatedAt  -createdAt",
      populate: [
        {
          path: "user",
          model: "UserProfile",
          localField: "user",
          foreignField: "user",
          select: "-location -dateOfBirth -carInfo -updatedAt -createdAt",
        },
        {
          path: "extraWork",
          model: "ExtraWork",
          localField: "extraWork",
          foreignField: "_id",
        },
      ],
    })
    .populate({
      path: "bidId",
      select: "-createdAt -updatedAt -__v",
      populate: {
        path: "mechanicId",
        model: "MechanicProfile",
        localField: "mechanicId",
        foreignField: "user",
        select:
          "-workshop -certificates -experience -createdAt -__v -updatedAt -location",
      },
    })

    .lean();

  if (!serviceData) {
    throw new AppError(status.NOT_FOUND, "No data found.");
  }

  return serviceData;
};

//-------------------------------mechanic-------------------------------------------

const getAllRequestedService = async (mechanicCoordinate: [number, number]) => {
  const aggregateArray: PipelineStage[] = [
    {
      $match: {
        status: Status.FINDING,
      },
    },
    {
      $lookup: {
        from: "bids",
        let: { serviceId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$reqServiceId", "$$serviceId"] },
            },
          },
        ],
        as: "bids",
      },
    },
    {
      // Remove services where ALL bids are declined
      $match: {
        $expr: {
          $or: [
            { $eq: [{ $size: "$bids" }, 0] }, // keep if no bids
            {
              $gt: [
                {
                  $size: {
                    $filter: {
                      input: "$bids",
                      as: "b",
                      cond: { $ne: ["$$b.status", BidStatus.declined] },
                    },
                  },
                },
                0,
              ],
            }, // keep if there's at least one non-declined bid
          ],
        },
      },
    },
    {
      $lookup: {
        from: "userprofiles",
        localField: "user",
        foreignField: "user",
        as: "profileData",
      },
    },
    {
      $addFields: {
        isBidDone: {
          $gt: [
            {
              $size: {
                $filter: {
                  input: "$bids",
                  as: "b",
                  cond: { $eq: ["$$b.status", BidStatus.provided] },
                },
              },
            },
            0,
          ],
        },
        location: {
          placeId: "$location.placeId",
          coordinates: "$location.coordinates.coordinates",
        },
      },
    },
    {
      $project: {
        "profileData.carInfo": 0,
        "profileData.location": 0,
        bids: 0,
      },
    },
  ];

  const data = await Service.aggregate(aggregateArray);

  const enriched = data.map((service: any) => {
    const distance = calculateDistance(
      mechanicCoordinate,
      service.location.coordinates
    );
    return {
      ...service,
      distanceKm: distance,
    };
  });

  return enriched;
};

const changeServiceStatus = async (
  pId: string,
  statusData: Status,
  extraWork: { issue: string; description: string; price: number }
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const paymentData = await Payment.findById(pId).session(session);
    if (!paymentData) {
      throw new AppError(status.NOT_FOUND, "Payment data not found.");
    }

    const bidData = await Bid.findOne({ _id: paymentData.bidId }).session(
      session
    );
    if (!bidData) {
      throw new AppError(status.NOT_FOUND, "Bid data not found.");
    }

    const serviceData = await Service.findById(bidData.reqServiceId).session(
      session
    );
    if (!serviceData) {
      throw new AppError(status.NOT_FOUND, "Service data not found.");
    }

    // Apply logic
    if (
      serviceData.status === Status.WAITING &&
      statusData === Status.WORKING
    ) {
      if (extraWork.price > 0) {
        bidData.extraWork = extraWork;
        paymentData.extraAmount = extraWork.price;
      }

      serviceData.status = Status.WORKING;
    } else if (
      serviceData.status === Status.WORKING &&
      statusData === Status.COMPLETED
    ) {
      serviceData.status = Status.COMPLETED;
      serviceData.isServiceCompleted = IsServiceCompleted.WAITING;
    } else {
      throw new AppError(
        status.BAD_REQUEST,
        `Failed to change service status. Current status: ${serviceData.status}`
      );
    }

    // Save all within transaction
    await bidData.save({ session });
    await paymentData.save({ session });
    const newData = await serviceData.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Notify via socket outside transaction
    const io = getSocket();
    io.emit("service-status", { paymentId: pId });

    return newData;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

const seeServiceDetails = async (sId: string) => {
  const service = await Service.findById(sId)
    .populate({
      path: "user",
      model: "UserProfile",
      foreignField: "user",
      select: " fullName image -_id ",
      populate: {
        path: "user",
        model: "User",
        foreignField: "_id",
        select: " -authentication  -needToResetPass -needToUpdateProfile -__v ",
      },
    })
    .lean();
  if (!service) {
    throw new Error("Service not found");
  }
  return {
    ...service,
    location: {
      placeId: service.location.placeId,
      coordinates: service.location.coordinates.coordinates,
    },
  };
};

//-----------------------------------Api for socket -------------------------------------

const pushNewServiceReq = async (serviceId: string) => {
  const aggregateArray: PipelineStage[] = [
    {
      $match: {
        status: Status.FINDING,
        _id: new mongoose.Types.ObjectId(serviceId),
      },
    },
    {
      $lookup: {
        from: "bids",
        let: { serviceId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$reqServiceId", "$$serviceId"] },
              status: { $ne: "declined" },
            },
          },
        ],
        as: "bid",
      },
    },
    {
      // Reshape the location field here
      $addFields: {
        location: {
          placeId: "$location.placeId",
          coordinates: "$location.coordinates.coordinates", // extract inner coordinates array
        },
      },
    },
    {
      $project: { bid: 0 },
    },
  ];

  const data = await Service.aggregate(aggregateArray);
  return data[0];
};

const addNewBidDataToService = async (
  serviceId: string,
  userId: string,
  bidId: string
) => {
  const service = await Service.findOne({
    _id: serviceId,
    status: Status.FINDING,
    user: userId,
  }).lean();

  if (!service || !service.location?.coordinates) {
    throw new Error("Service not found or missing location");
  }

  const bids = await Bid.aggregate([
    {
      $match: {
        reqServiceId: service._id,
        _id: new mongoose.Types.ObjectId(bidId),
      },
    },

    // Step 1: Join Mechanic Profile
    {
      $lookup: {
        from: "mechanicprofiles",
        localField: "mechanicId",
        foreignField: "user",
        as: "mechanicProfile",
      },
    },
    { $unwind: "$mechanicProfile" },

    // Step 2: Join Mechanic Ratings (all ratings of that mechanic)

    {
      $lookup: {
        from: "mechanicratings",
        localField: "mechanicId",
        foreignField: "mechanicId",
        as: "ratingDocs",
      },
    },

    // Step 3: Calculate average rating and count
    {
      $addFields: {
        averageRating: {
          $cond: [
            { $gt: [{ $size: "$ratingDocs" }, 0] },
            {
              $avg: "$ratingDocs.rating",
            },
            0,
          ],
        },
        totalReviews: { $size: "$ratingDocs" },
      },
    },

    // Step 4: Project only needed fields
    {
      $project: {
        price: 1,
        status: 1,
        mechanicId: 1,
        averageRating: { $round: ["$averageRating", 1] },
        totalReviews: 1,
        "mechanicProfile.fullName": 1,
        "mechanicProfile.image": 1,
        "mechanicProfile.workshop.name": 1,
        "mechanicProfile.workshop.location.placeId": 1,
        "mechanicProfile.workshop.location.coordinates":
          "$mechanicProfile.workshop.location.coordinates.coordinates",
      },
    },
  ]);

  // Step 5: Add distance in Node.js (still more efficient this way)
  const newData = bids.map((bid) => {
    const coords = bid.mechanicProfile?.workshop.location.coordinates;
    console.log(coords);
    const distance = coords
      ? calculateDistance(
          service.location.coordinates.coordinates as [number, number],
          coords
        )
      : null;

    return {
      ...bid,
      distance: distance ? parseFloat(distance.toFixed(2)) : null,
    };
  });

  return newData[0];
};

export const ServiceService = {
  addServiceReq,
  checkServiceStatusFinding,
  getBidListOfService,
  hireMechanic,

  cancelService,
  seeServiceDetails,

  getRunningService,
  getAllRequestedService,
  seeCurrentServiceProgress,
  pushNewServiceReq,
  addNewBidDataToService,
  changeServiceStatus,
  markServiceAsComplete,
};

//helper function
const calculateDistance = (
  coords1: [number, number],
  coords2: [number, number]
): number => {
  const R = 6371; // km

  const [lon1, lat1] = coords1;
  const [lon2, lat2] = coords2;

  const dLat = (lat2 - lat1) * (Math.PI / 180);

  let dLon = lon2 - lon1;
  if (dLon > 180) {
    dLon -= 360;
  } else if (dLon < -180) {
    dLon += 360;
  }
  dLon = dLon * (Math.PI / 180);

  const lat1Rad = lat1 * (Math.PI / 180);
  const lat2Rad = lat2 * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Number((R * c).toFixed(2));
};
