import { status } from "http-status";
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose, { model, PipelineStage } from "mongoose";
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { Service } from "./service.model";
import { IService, Status } from "./service.interface";
import Bid from "../bid/bid.model";

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

//! ----------------------------for users-------------------------------//

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
  console.log(coords1, coords2, Number((R * c).toFixed(2)));
  return Number((R * c).toFixed(2));
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
        "mechanicProfile.workshop.name": 1,
        "mechanicProfile.workshop.location.placeId": 1,
        "mechanicProfile.workshop.location.coordinates":
          "$mechanicProfile.workshop.location.coordinates.coordinates",
      },
    },
  ]);

  // Step 5: Add distance in Node.js (still more efficient this way)
  return bids.map((bid) => {
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
  });
};

// call payment intent function from stripe.service.ts file

const hireMechanic = async (data: { bidId: string }, userId: string) => {
  const bidData = await Bid.findById(data.bidId);

  if (!bidData) {
    throw new AppError(status.NOT_FOUND, "Bid data not found");
  }

  const isServiceExist = await Service.findOne({
    _id: bidData.reqServiceId,
    user: userId,
  });

  if (!isServiceExist) {
    throw new AppError(status.NOT_FOUND, "Service not found.");
  }

  const paymentIntentData = {
    bidId: bidData._id,
    isForExtraWork: false,
    bidPrice: bidData.price,
    serviceId: bidData.reqServiceId,
    userId,
  };

  const result = await StripeService.createPaymentIntent(paymentIntentData);

  // need to validate before payment done...if payment already done or not

  return {
    bidId: data.bidId,
    result,
    serviceId: bidData.reqServiceId,
  };
};

const markServiceAsComplete = async (pId: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Get initial payment
    const paymentData = await Payment.findById(pId).session(session);
    if (!paymentData)
      throw new AppError(status.NOT_FOUND, "Payment data not found.");

    // 2. Get associated service
    const serviceData = await Service.findOne({
      _id: paymentData.serviceId,
      status: Status.COMPLETED,
    }).session(session);
    if (!serviceData)
      throw new AppError(status.NOT_FOUND, "Service data not found.");

    if (serviceData.isStatusAccepted) {
      throw new AppError(
        status.BAD_REQUEST,
        "Service already marked as completed."
      );
    }

    serviceData.isStatusAccepted = true;
    await serviceData.save({ session });

    // 3. Get bid data
    const bidData = await Bid.findOne({
      reqServiceId: serviceData._id,
    }).session(session);
    if (!bidData) throw new AppError(status.NOT_FOUND, "Bid data not found");

    // 4. Get full payment record
    const paymentRecord = await Payment.findOne({
      bidId: bidData._id,
    }).session(session);
    if (!paymentRecord?.txId) {
      throw new AppError(status.BAD_REQUEST, "Payment or txId not found");
    }

    // 5. Get mechanic profile & Stripe ID
    const mechanicProfile = await MechanicProfile.findById(
      bidData.mechanicId
    ).session(session);
    if (!mechanicProfile?.stripeAccountId) {
      throw new AppError(status.BAD_REQUEST, "Mechanic Stripe ID missing");
    }
    const stripeAccountId = decrypt(mechanicProfile.stripeAccountId);

    // 6. Get main payment intent
    const mainIntent = await stripe.paymentIntents.retrieve(paymentRecord.txId);
    if (mainIntent.status !== "succeeded") {
      throw new AppError(status.BAD_REQUEST, "Main payment not successful");
    }

    let extraAmount = 0;

    // 7. Optional: Get extra work payment intent
    if (
      paymentRecord.extraPay?.status === PaymentStatus.HOLD &&
      paymentRecord.extraPay?.txId
    ) {
      const extraIntent = await stripe.paymentIntents.retrieve(
        paymentRecord.extraPay.txId
      );
      if (extraIntent?.status === "succeeded") {
        extraAmount = extraIntent.amount_received;
      }
    }

    // 8. Calculate 90% from total (main + extra)
    const totalReceived = mainIntent.amount_received + extraAmount;
    const amountToTransfer = Math.floor(totalReceived * 0.9); // 10% fee once

    // 9. Transfer to mechanic
    const transfer = await stripe.transfers.create({
      amount: amountToTransfer,
      currency: mainIntent.currency,
      destination: stripeAccountId,
      description: `Payout for bid ${bidData._id}`,
    });

    if (!transfer?.id) {
      throw new AppError(status.BAD_REQUEST, "Failed to transfer payment");
    }

    // 10. Update payment status
    paymentRecord.status = PaymentStatus.PAID;
    paymentRecord.transferId = transfer.id;
    await paymentRecord.save({ session });

    // 11. Emit socket event
    getSocket().emit("markAsComplete", { bidId: bidData._id });

    await session.commitTransaction();
    session.endSession();

    return serviceData;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw new Error((error as Error).message || "Unknown error");
  }
};

//! --------------------------for mechanics and users-------------------------------//

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

    await StripeService.refundPayment(paymentData.txId);

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
      populate: {
        path: "user",
        model: "UserProfile",
        localField: "user",
        foreignField: "user",
        select: "-location   -dateOfBirth  -carInfo  -updatedAt  -createdAt",
      },
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

  return serviceData;
};

//! ----------------------------for mechanics-------------------------------//

const getAllRequestedService = async () => {
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
              $expr: {
                $eq: ["$reqServiceId", "$$serviceId"],
              },
              status: { $ne: BidStatus.declined },
            },
          },
        ],
        as: "bid",
      },
    },
    {
      $addFields: {
        isBidDone: {
          $gt: [
            {
              $size: {
                $filter: {
                  input: "$bid",
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
        bid: 0, // remove the full bid array if not needed
      },
    },
  ];

  const data = await Service.aggregate(aggregateArray);
  return data;
};

const changeServiceStatus = async (pId: string) => {
  const paymentData = await Payment.findById(pId);

  if (!paymentData) {
    throw new AppError(status.NOT_FOUND, "Payment data not found.");
  }

  const bidData = await Bid.findOne({ _id: paymentData.bidId });

  if (!bidData) {
    throw new AppError(status.NOT_FOUND, "Bid data not found.");
  }

  const serviceData = await Service.findById(bidData.reqServiceId);

  if (!serviceData) {
    throw new AppError(status.NOT_FOUND, "Service data not found.");
  }

  if (serviceData?.status === Status.WAITING) {
    serviceData.status = Status.WORKING;
  } else if (serviceData.status === Status.WORKING) {
    serviceData.status = Status.COMPLETED;
    serviceData.isStatusAccepted = false;
  } else {
    throw new AppError(status.BAD_REQUEST, "Faild to change service status");
  }

  const newData = await serviceData.save();

  const io = getSocket();
  io.emit("service-status", { paymentId: pId });
  return newData;
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

//-------------------------------------------------------------------------------------Api for socket -----------------------------------------------------------------

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
