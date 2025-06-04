/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose, { PipelineStage } from "mongoose";
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { ExtraWork, Service } from "./service.model";
import { IService, Status } from "./service.interface";
import Bid from "../bid/bid.model";

import { StripeService } from "../../stripe/stripe.service";

import User from "../../users/user/user.model";
import AppError from "../../../errors/AppError";
import status from "http-status";
import { getSocket } from "../../../socket/socket";
import Payment from "../../stripe/payment.model";
import { PaymentStatus } from "../../stripe/payment.interface";

import { MechanicProfile } from "../../users/mechanicProfile/mechanicProfile.model";
import { stripe } from "../../stripe/stripe";
import { decrypt } from "../../../utils/helper/encrypt&decrypt";

// ------------------------------------for users-------------------------------//

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
  if (isScheduled) {
    const existingScheduled = await Service.findOne({
      user: userId,
      status: { $in: [Status.FINDING, Status.WORKING, Status.WAITING] },
      "schedule.isSchedule": true,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });

    if (existingScheduled) {
      throw new Error("You already have a scheduled service request today.");
    }
  }
  // 2. If this is an unscheduled request, check if there's already an unscheduled service today
  else {
    const existingUnscheduled = await Service.findOne({
      user: userId,
      status: { $in: [Status.FINDING, Status.WORKING, Status.WAITING] },
      "schedule.isSchedule": false,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });

    if (existingUnscheduled) {
      throw new Error("You already have an unscheduled service request today.");
    }
  }

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

const getBidListOfService = async (serviceId: string, userId: string) => {
  const service = await Service.findOne({
    _id: serviceId,
    status: Status.FINDING,
    user: userId,
  }).lean();

  if (!service || !service.location?.coordinates) {
    throw new Error("Service not found or missing location");
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

const hireMechanic = async (bidId: string, userId: string) => {
  const paymentIntent = await StripeService.createPaymentIntent(bidId);

  if (paymentIntent.client_secret) {
    const datas = await Payment.findOne({
      bidId: bidId,
    });
    if (!datas) {
      await Payment.create({
        bidId: bidId,
        status: PaymentStatus.UNPAID,
      });
    }

    if (
      datas &&
      (datas.status === PaymentStatus.HOLD ||
        datas.status === PaymentStatus.REFUNDED ||
        datas.status === PaymentStatus.PAID ||
        datas.status === PaymentStatus.CANCELLED)
    ) {
      throw new AppError(
        status.BAD_REQUEST,
        `Payment for this bid status is: ${datas.status}`
      );
    }
  } else {
    throw new AppError(status.BAD_REQUEST, "Failed to create client secret.");
  }

  return {
    bidId,
    paymentIntent,
  };
};

const cancelService = async (
  id: string,
  serviceData: Partial<IService>
): Promise<IService> => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // 1. Update the service document inside the transaction
    const service = await Service.findByIdAndUpdate(id, serviceData, {
      new: true,
      session, // Important: pass session here
    });

    if (!service) {
      throw new Error("Service not found");
    }

    // 2. Find the related bid inside the transaction
    const bid = await Bid.findOne({ reqServiceId: id }).session(session);

    if (!bid) {
      throw new Error("Bid data not found");
    }

    // 3. Call Stripe refund (external system)
    // Note: This is NOT a DB operation, so it can't be part of the DB transaction
    await StripeService.refundPayment(bid._id, session);

    const io = getSocket();
    io.emit("cencel", { serviceId: id });

    // 4. Commit transaction only after refund succeeds
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

const markServiceAsComplete = async (sId: string) => {
  const session = await mongoose.startSession();

  try {
    const serviceData = await Service.findOne({
      _id: sId,
      status: Status.COMPLETED,
    });

    if (!serviceData) {
      throw new AppError(status.NOT_FOUND, "Service data not found.");
    }

    if (serviceData.isStatusAccepted !== false) {
      throw new AppError(
        status.BAD_REQUEST,
        "Service failed to mark as completed."
      );
    }

    serviceData.isStatusAccepted = true; //--------------------

    await serviceData.save({ session });

    const bidData = await Bid.findOne({
      reqServiceId: serviceData._id,
    }).session(session);

    if (!bidData) {
      throw new Error("Bid data not found");
    }

    const paymentRecord = await Payment.findOne({
      bidId: bidData?._id,
    }).session(session);

    if (!paymentRecord || !paymentRecord.txId) {
      throw new Error("Payment or txId not found");
    }

    const mechanicProfile = await MechanicProfile.findById(
      bidData.mechanicId
    ).session(session);

    if (!mechanicProfile || !mechanicProfile.stripeAccountId) {
      throw new Error("Mechanic Stripe ID missing");
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(
      paymentRecord.txId
    );
    if (paymentIntent.status !== "succeeded") {
      throw new Error("Payment not successful");
    }

    const stripeAccountId = decrypt(mechanicProfile.stripeAccountId);

    const amountToTransfer = Math.floor(paymentIntent.amount_received * 0.9);

    const transfer = await stripe.transfers.create({
      amount: amountToTransfer,
      currency: paymentIntent.currency,
      destination: stripeAccountId,
      description: `Payout for bid ${bidData._id}`,
    });

    if (!transfer.id) {
      throw new AppError(status.BAD_REQUEST, "Faild to transfer payment");
    }

    paymentRecord.status = PaymentStatus.PAID;
    paymentRecord.transferId = transfer.id;
    await paymentRecord.save({ session });

    const io = getSocket();

    io.emit("markAsComplete", { bidId: bidData._id });

    await session.commitTransaction();
    session.endSession();

    return serviceData;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw new Error(error as any);
  }
};

// ---------------------------------for mechanics and users-------------------------------//

const getRunningService = async (userId: string) => {
  const activeStatuses = [Status.FINDING, Status.WORKING, Status.WAITING];

  const userData = await User.findById(userId).lean();
  if (userData && userData.role === "USER") {
    const service = await Service.findOne({
      user: userId,
      status: { $in: activeStatuses },
    })
      .populate("extraWork")
      .populate({
        path: "user",
        model: "UserProfile",
        foreignField: "user",
        select: "fullName email -_id image",
      })
      .select("status issue location description")
      .lean();

    if (!service) {
      throw new Error("Service not found");
    }

    const bidData = (await Bid.findOne({ reqServiceId: service._id })
      .populate({
        path: "mechanicId",
        model: "MechanicProfile",
        foreignField: "user",
        select: "fullName email image workshop.location",
      })
      .lean()) as any;

    const location =
      bidData?.mechanicId.workshop.location.coordinates.coordinates;
    const { workshop, ...other } = bidData.mechanicId;
    return {
      ...service,
      price: bidData?.price,
      mechanicProfile: {
        ...other,
        location: location,
      },
    };
  } else if (userData && userData?.role === "MECHANIC") {
    const bidData = (await Bid.findOne(
      {
        mechanicId: userId,
      },
      { price: 1, status: 1, reqServiceId: 1 }
    ) // only needed bid fields
      .populate({
        path: "reqServiceId",
        match: { status: { $in: [Status.WORKING, Status.WAITING] } },
        select: "status issue location description",
        populate: [
          {
            path: "extraWork",
            select: "issue description price status",
            options: { lean: true },
          },
          {
            path: "user",
            model: "UserProfile",
            foreignField: "user",
            select: "fullName -_id image email user",
            options: { lean: true },
          }, // adjust user fields as needed
        ],
        options: { lean: true }, // populate with lean for performance
      })
      .populate({
        path: "mechanicId",
        model: "MechanicProfile",
        foreignField: "user",
        select: "fullName -_id email workshop image",
      })
      .lean() // make the main query lean
      .exec()) as any;

    console.log(bidData);

    if (bidData && bidData?.reqServiceId?._id) {
      const location =
        bidData?.mechanicId.workshop.location.coordinates.coordinates;
      const { workshop, ...other } = bidData.mechanicId;

      return {
        ...bidData.reqServiceId,
        price: bidData.price,
        mechanicProfile: {
          ...other,
          location: location,
        },
      };
    }
    return null;
  } else {
    return null;
  }
};

// ------------------------------------for mechanics-------------------------------//

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
  return data;
};

const changeServiceStatus = async (bId: string) => {
  const bidData = await Bid.findById(bId);

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
  io.emit("status", { serviceId: serviceData._id });
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
        select: " -authentication -needToResetPass -needToUpdateProfile -__v ",
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

const reqForExtraWork = async (
  sId: string,
  data: {
    price: number;
    issue: string;
    description: string;
  }
) => {
  const serviceData = await Service.findById(sId);
  if (!serviceData) {
    throw new AppError(status.NOT_FOUND, "Service not found");
  }
  const extraWork = await ExtraWork.create({ ...data, reqServiceId: sId });
  return extraWork;
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
  getBidListOfService,
  hireMechanic,
  cancelService,
  seeServiceDetails,
  reqForExtraWork,
  getRunningService,
  getAllRequestedService,

  pushNewServiceReq,
  addNewBidDataToService,
  changeServiceStatus,
  markServiceAsComplete,
};
