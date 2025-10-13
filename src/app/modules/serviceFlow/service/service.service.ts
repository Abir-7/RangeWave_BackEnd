import { createRoomAfterHire } from "./../../chat/room/room.service";
/* eslint-disable arrow-body-style */
import { status } from "http-status";
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose, { model, PipelineStage, Types } from "mongoose";
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { Service } from "./service.model";
import { IService, IsServiceCompleted, Status } from "./service.interface";

import { StripeService } from "../../stripe/stripe.service";

import User from "../../users/user/user.model";
import AppError from "../../../errors/AppError";

import { getSocket } from "../../../socket/socket";
import Payment from "../../stripe/payment.model";
import { PaymentStatus, PaymentType } from "../../stripe/payment.interface";

import { MechanicProfile } from "../../users/mechanicProfile/mechanicProfile.model";

import { BidStatus } from "../bid/bid.interface";
import { Bid } from "../bid/bid.model";
import { TUserRole } from "../../../interface/auth.interface";
import ChatRoom from "../../chat/room/room.model";
import { UserCarIssue } from "../../carIssue/carIssuse.model";
import logger from "../../../utils/logger";
import UserRating from "../../rating/userRating/userRating.model";
import MechanicRating from "../../rating/mechanicRating/mechanicRating.model";

//------------------------for users--------------------------//

// const addServiceReq = async (
//   serviceData: {
//     issue: string;
//     isNew: boolean;
//     description: string;
//     location: {
//       placeId: string;
//       coordinates: number[];
//     };
//     schedule?: {
//       date: Date;
//     };
//   },
//   userId: string
// ): Promise<IService> => {
//   const location = {
//     placeId: serviceData.location.placeId,
//     coordinates: {
//       type: "Point",
//       coordinates: serviceData.location.coordinates,
//     },
//   };

//   const today = new Date();
//   // Set time range for today (start and end)
//   const startOfDay = new Date(today.setHours(0, 0, 0, 0));
//   const endOfDay = new Date(today.setHours(23, 59, 59, 999));

//   const isScheduled = !!serviceData.schedule?.date;

//   // 1. If this is a scheduled request, check if there's already a scheduled service today
//   // if (isScheduled) {
//   //   const existingScheduled = await Service.findOne({
//   //     user: userId,
//   //     status: { $in: [Status.FINDING, Status.WORKING, Status.WAITING] },
//   //     "schedule.isSchedule": true,
//   //     createdAt: { $gte: startOfDay, $lte: endOfDay },
//   //   });

//   //   if (existingScheduled) {
//   //     throw new Error("You already have a scheduled service request today.");
//   //   }
//   // }
//   // // 2. If this is an unscheduled request, check if there's already an unscheduled service today
//   // else {
//   //   const existingUnscheduled = await Service.findOne({
//   //     user: userId,
//   //     status: { $in: [Status.FINDING, Status.WORKING, Status.WAITING] },
//   //     "schedule.isSchedule": false,
//   //     createdAt: { $gte: startOfDay, $lte: endOfDay },
//   //   });

//   //   if (existingUnscheduled) {
//   //     throw new Error("You already have an unscheduled service request today.");
//   //   }
//   // }

//   // If no conflict, create the new service

//   const service = await Service.create({
//     issue: serviceData.issue,
//     description: serviceData.description,
//     user: userId,
//     location,
//     ...(isScheduled
//       ? {
//           schedule: {
//             isSchedule: true,
//             date: serviceData.schedule!.date,
//           },
//         }
//       : {
//           // For unscheduled, rely on default: { isSchedule: false, date: null }
//         }),
//   });

//   if (serviceData.isNew) {
//     await UserCarIssue.create({ name: serviceData.issue, user: userId });
//   }

//   const io = getSocket();
//   // socket-emit
//   io.emit("new-service", { serviceId: service._id });

//   return service;
// };

const addServiceReq = async (
  serviceData: {
    issue: string;
    isNew: boolean;
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
  console.log(userId);

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

  const session = await mongoose.startSession();

  let service: any;

  try {
    await session.withTransaction(async () => {
      service = await Service.create(
        [
          {
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
          },
        ],
        { session }
      );

      if (serviceData.isNew) {
        await UserCarIssue.create([{ name: serviceData.issue, user: userId }], {
          session,
        });
      }
    });

    const io = getSocket();
    // socket-emit
    if (service && service[0]) {
      io.emit("new-service", { serviceId: service[0]._id });
    }

    return service[0];
  } catch (error) {
    logger.error("❌ Error creating service:", error);
    throw error;
  } finally {
    await session.endSession();
  }
};

const checkServiceStatusFinding = async (userId: string) => {
  const services = await Service.find({
    user: userId,
    status: Status.FINDING,
  }).sort({ createdAt: -1 });

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
  return bids.map((bid: any) => {
    // const coords = bid.location?.coordinates?.coordinates;
    const coords = bid.mechanicProfile?.workshop?.location?.coordinates;

    const distance =
      coords.length > 1
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
    await createRoomAfterHire(
      [bidData.mechanicId.toString(), isServiceExist.user.toString()],
      session
    );

    await session.commitTransaction();
    session.endSession();

    //! Socket need------------------------------------------------
    const io = getSocket();
    io.emit(`hire-${bidData.mechanicId}`, {
      serviceId: isServiceExist._id,
      paymentId: payment[0]._id,
    });

    io?.emit(`user-${bidData.mechanicId}`, {
      message: "You have been hired.",
      paymentId: payment[0]._id,
    });

    return payment[0]; // create returns an array
  } catch (err: any) {
    await session.abortTransaction();
    session.endSession();
    throw new Error(err);
  }
};
const markServiceAsComplete = async (pId: string, paymentType: PaymentType) => {
  console.log(paymentType);

  if (
    paymentType !== PaymentType.OFFLINE &&
    paymentType !== PaymentType.ONLINE
  ) {
    throw new AppError(status.BAD_REQUEST, "Invalid payment  option.");
  }
  if (paymentType === PaymentType.OFFLINE) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const paymentData = await Payment.findOne({ _id: pId }).session(session);
      if (!paymentData) {
        throw new AppError(status.NOT_FOUND, "Payment data not found.");
      }

      paymentData.paymentType = PaymentType.OFFLINE;
      paymentData.status = PaymentStatus.PAID;
      const serviceData = await Service.findOne({
        _id: paymentData.serviceId,
      }).session(session);
      if (!serviceData) {
        throw new AppError(status.NOT_FOUND, "Service data not found.");
      }

      serviceData.isServiceCompleted = IsServiceCompleted.YES;

      await Promise.all([
        paymentData.save({ session }),
        serviceData.save({ session }),
      ]);

      await session.commitTransaction();
      session.endSession();

      //-----------------------------------socket------------------
      const io = getSocket();

      io.emit(`progress-${paymentData._id}`, {
        paymentId: paymentData._id,
      });

      io?.emit(`user-${paymentData.mechanicId}`, {
        message: "Customer mark service as done.",
        paymentId: pId,
      });

      return {
        paymentIntent: "",
        message: "Work mark as comleted.",
        paymentType,
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }
  //----------------------------------------------------
  if (paymentType === PaymentType.ONLINE) {
    const result = await StripeService.createPaymentIntent(pId);
    return {
      paymentIntent: result.paymentIntent,
      message: "PaymentIntent Created",
      paymentType,
    };
  }
};

const mechanicDetails = async (m_id: string) => {
  const mechanic = await MechanicProfile.findOne({ user: m_id })
    .select("-createdAt -updatedAt -isNeedToPayForWorkShop")
    .populate("user", "email role")
    .lean();

  const result = await MechanicRating.aggregate([
    {
      $match: { mechanicId: new mongoose.Types.ObjectId(m_id) },
    },
    {
      $group: {
        _id: "$mechanicId",
        averageRating: { $avg: "$rating" },
        totalRatings: { $sum: 1 },
      },
    },
  ]);

  const totalServiceDone = await Payment.countDocuments({
    mechanicId: new mongoose.Types.ObjectId(m_id),
    status: PaymentStatus.PAID,
  });

  const data = result[0] || {
    averageRating: 0,
    totalRatings: 0,
  };

  return { ...mechanic, ...data, totalServiceDone };
};

export const getMechanicRatings = async (mechanicId: string) => {
  const ratings = await MechanicRating.aggregate([
    {
      $match: {
        mechanicId: new mongoose.Types.ObjectId(mechanicId),
      },
    },
    {
      $lookup: {
        from: "userprofiles", // must match the actual Mongo collection name
        localField: "user", // from MechanicRating
        foreignField: "user", // from UserProfile
        as: "userProfile",
      },
    },
    {
      $unwind: {
        path: "$userProfile",
        preserveNullAndEmptyArrays: true, // in case userProfile missing
      },
    },
    {
      $project: {
        _id: 0,
        rating: 1,
        text: 1,
        name: "$userProfile.fullName",
      },
    },
  ]);

  return ratings;
};
const getUserRatings = async (userId: string) => {
  const ratings = await UserRating.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "mechanicprofiles", // must match the actual Mongo collection name
        localField: "mechanicId", // from MechanicRating
        foreignField: "user", // from UserProfile
        as: "mechanicProfile",
      },
    },
    {
      $unwind: {
        path: "$mechanicProfile",
        preserveNullAndEmptyArrays: true, // in case userProfile missing
      },
    },
    {
      $project: {
        _id: 0,
        rating: 1,
        text: 1,
        name: "$mechanicProfile.fullName",
      },
    },
  ]);

  return ratings;
};

//-----------------------common----------------------------
const getRunningService = async (userId: string) => {
  const userData = await User.findById(userId).lean();
  if (!userData) {
    throw new AppError(status.NOT_FOUND, "User not found.");
  }

  let filter: any = {};
  if (userData.role === "USER") {
    filter = { status: PaymentStatus.UNPAID, user: userId }; //
  } else if (userData.role === "MECHANIC") {
    filter = { status: PaymentStatus.UNPAID, mechanicId: userId };
  } else {
    throw new AppError(status.BAD_REQUEST, "Invalid user role.");
  }

  const payments = await Payment.find(filter)
    .populate({ path: "bidId", select: "price status extraWork location" })
    .populate({
      path: "serviceId",
      select:
        "description status isServiceCompleted issue schedule location updatedAt",
    })
    .populate({
      path: "userProfile",
      select: "-carInfo -createdAt -updatedAt -__v",
    })
    .populate({
      path: "mechanicProfile",
      select: "-workshop -experience -certificates -createdAt -updatedAt -__v",
    })
    .select("-id -__v  -updatedAt ")
    .sort({ updatedAt: -1 });

  if (!payments.length) {
    return [];
  }
  console.log(payments);
  return payments;
};

const cancelService = async (
  pId: string,
  serviceData: { cancelReson: string },
  userId: string,
  userRoleDAta: TUserRole
): Promise<IService> => {
  const session = await mongoose.startSession();
  console.log(pId, "ssss", userId);
  try {
    session.startTransaction();

    const paymentData = await Payment.findOne({
      _id: pId,
      status: PaymentStatus.UNPAID,
    });

    if (!paymentData) {
      throw new AppError(status.NOT_FOUND, "Payment data not found");
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

    paymentData.status = PaymentStatus.CANCELLED;
    await paymentData.save({ session });

    const isMechanic = userRoleDAta === "MECHANIC";

    const io = getSocket();

    io.emit(`progress-${paymentData._id}`, { paymentId: pId });

    io?.emit(`user-${isMechanic ? paymentData.user : paymentData.mechanicId}`, {
      message: `${
        isMechanic
          ? "Mechanic cencel your service"
          : "Customer cencel his service"
      }`,
      paymentId: pId,
    });

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
const seeCurrentServiceProgress = async (
  pId: string,
  userRoleData: TUserRole
) => {
  const serviceData = await Payment.findOne({ _id: pId })
    .populate({ path: "bidId", select: "price status extraWork location" })
    .populate({
      path: "serviceId",
      select: "description status isServiceCompleted issue schedule location",
    })
    .populate({
      path: "userProfile",
      select: "-carInfo -createdAt -updatedAt -__v",
    })
    .populate({
      path: "mechanicProfile",
      select: "-workshop -experience -certificates -createdAt -updatedAt -__v",
    })
    .select("-id -__v -createdAt -updatedAt")
    .lean();

  const chatRoom = await ChatRoom.findOne({
    users: { $all: [serviceData?.mechanicId._id, serviceData?.user._id] }, // both users must be in the array
  });

  if (!serviceData) {
    throw new AppError(status.NOT_FOUND, "No data found.");
  }
  let avgRating = 0;
  if (userRoleData === "MECHANIC") {
    const avgResult = await UserRating.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(serviceData.user) } },
      { $group: { _id: null, averageRating: { $avg: "$rating" } } },
    ]);
    avgRating = avgResult[0]?.averageRating || 0;
  }

  if (userRoleData === "USER") {
    const avgResult = await MechanicRating.aggregate([
      {
        $match: {
          mechanicId: new mongoose.Types.ObjectId(serviceData.mechanicId),
        },
      },
      { $group: { _id: null, averageRating: { $avg: "$rating" } } },
    ]);
    avgRating = avgResult[0]?.averageRating || 0;
  }

  return {
    ...serviceData,
    chatId: chatRoom?._id || "",
    avgRating: Number(avgRating.toFixed(2)),
  };
};

//-------------------------------mechanic-------------------------------------------

// const getAllRequestedService = async (
//   mechanicId: string,
//   mechanicCoordinate: [number, number]
// ) => {
//   const aggregateArray: PipelineStage[] = [
//     // 1. Match services that are FINDING
//     {
//       $match: {
//         status: Status.FINDING,
//       },
//     },

//     // 2. Lookup bids for each service
//     {
//       $lookup: {
//         from: "bids",
//         let: { serviceId: "$_id" },
//         pipeline: [
//           {
//             $match: {
//               $expr: { $eq: ["$reqServiceId", "$$serviceId"] },
//             },
//           },
//         ],
//         as: "bids",
//       },
//     },

//     // 3. Remove services where this mechanic has only declined bids
//     {
//       $match: {
//         $expr: {
//           $or: [
//             // Mechanic has no bids for this service
//             {
//               $eq: [
//                 {
//                   $size: {
//                     $filter: {
//                       input: "$bids",
//                       as: "b",
//                       cond: {
//                         $eq: [
//                           "$$b.mechanicId",
//                           new mongoose.Types.ObjectId(mechanicId),
//                         ],
//                       },
//                     },
//                   },
//                 },
//                 0,
//               ],
//             },
//             // Mechanic has at least one non-declined bid
//             {
//               $gt: [
//                 {
//                   $size: {
//                     $filter: {
//                       input: "$bids",
//                       as: "b",
//                       cond: {
//                         $and: [
//                           {
//                             $eq: [
//                               "$$b.mechanicId",
//                               new mongoose.Types.ObjectId(mechanicId),
//                             ],
//                           },
//                           { $ne: ["$$b.status", BidStatus.declined] },
//                         ],
//                       },
//                     },
//                   },
//                 },
//                 0,
//               ],
//             },
//           ],
//         },
//       },
//     },

//     // 4. Lookup user profile
//     {
//       $lookup: {
//         from: "userprofiles",
//         localField: "user",
//         foreignField: "user",
//         as: "profileData",
//       },
//     },

//     // 5. Lookup user ratings
//     {
//       $lookup: {
//         from: "userratings",
//         let: { userId: { $arrayElemAt: ["$profileData.user", 0] } },
//         pipeline: [
//           {
//             $match: {
//               $expr: { $eq: ["$mechanicId", "$$userId"] },
//             },
//           },
//         ],
//         as: "userRatings",
//       },
//     },

//     // 6. Filter out declined bids and add calculated fields
//     {
//       $addFields: {
//         bids: {
//           $filter: {
//             input: "$bids",
//             as: "b",
//             cond: { $ne: ["$$b.status", BidStatus.declined] },
//           },
//         },
//         isBidDone: {
//           $gt: [
//             {
//               $size: {
//                 $filter: {
//                   input: "$bids",
//                   as: "b",
//                   cond: { $eq: ["$$b.status", BidStatus.provided] },
//                 },
//               },
//             },
//             0,
//           ],
//         },
//         location: {
//           placeId: "$location.placeId",
//           coordinates: "$location.coordinates.coordinates",
//         },
//         avgRating: { $ifNull: [{ $avg: "$userRatings.rating" }, 0] },
//       },
//     },

//     // 7. Project unnecessary fields
//     {
//       $project: {
//         "profileData.carInfo": 0,
//         "profileData.location": 0,
//         bids: 0,
//         userRatings: 0,
//       },
//     },
//   ];

//   const data = await Service.aggregate(aggregateArray);

//   // 8. Add distance calculation
//   const enriched = data.map((service: any) => {
//     const distance = calculateDistance(
//       mechanicCoordinate,
//       service.location.coordinates
//     );

//     return {
//       ...service,
//       distanceKm: distance,
//     };
//   });

//   return enriched;
// };

const getAllRequestedService = async (
  mechanicId: string,
  mechanicCoordinate: [number, number]
) => {
  const aggregateArray = [
    { $match: { status: "FINDING" } },

    {
      $lookup: {
        from: "bids",
        localField: "_id",
        foreignField: "reqServiceId",
        as: "bids",
      },
    },

    // Lookup mechanic's own bid
    {
      $lookup: {
        from: "bids",
        let: { requestId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$reqServiceId", "$$requestId"] },
                  {
                    $eq: [
                      "$mechanicId",
                      new mongoose.Types.ObjectId(mechanicId),
                    ],
                  },
                ],
              },
            },
          },
          { $limit: 1 },
        ],
        as: "mechanicBid",
      },
    },
    { $unwind: { path: "$mechanicBid", preserveNullAndEmptyArrays: true } },

    // Remove services where same mechanic declined
    {
      $match: {
        $or: [
          { mechanicBid: { $exists: false } },
          // { "mechanicBid.status": "provided" },
        ],
      },
    },

    // Lookup profile and ratings
    {
      $lookup: {
        from: "userprofiles",
        localField: "user",
        foreignField: "user",
        as: "profileData",
      },
    },
    {
      $lookup: {
        from: "userratings",
        let: { userId: { $arrayElemAt: ["$profileData.user", 0] } },
        pipeline: [{ $match: { $expr: { $eq: ["$user", "$$userId"] } } }],
        as: "userRatings",
      },
    },

    {
      $addFields: {
        price: { $ifNull: ["$mechanicBid.price", null] },
        isBidDone: {
          $cond: [{ $eq: ["$mechanicBid.status", "provided"] }, true, false],
        },
        location: {
          placeId: "$location.placeId",
          coordinates: "$location.coordinates.coordinates",
        },
        avgRating: { $ifNull: [{ $avg: "$userRatings.rating" }, 0] },
      },
    },

    {
      $project: {
        "profileData.carInfo": 0,
        "profileData.location": 0,
        bids: 0,
        userRatings: 0,
        mechanicBid: 0,
      },
    },
    { $sort: { createdAt: -1 } },
  ] as any;

  const mechanicData = await MechanicProfile.findOne({ user: mechanicId });

  const data = await Service.aggregate(aggregateArray);

  const workshopLocation = mechanicData?.workshop?.location?.coordinates
    ?.coordinates as [number, number];
  // Add distance
  const enriched = data.map((service: any) => ({
    ...service,
    distanceKm:
      workshopLocation.length > 1
        ? calculateDistance(workshopLocation, service.location.coordinates)
        : 0,
  }));

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
      if (extraWork?.price > 0) {
        bidData.extraWork = extraWork;
        paymentData.extraAmount = extraWork?.price;
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

    const statusMessages: Record<Status, string> = {
      [Status.FINDING]: "Service is being searched...",
      [Status.WAITING]: "Service is waiting for approval...",
      [Status.WORKING]: "Service is in progress...",
      [Status.COMPLETED]: "Service has been completed.",
      [Status.CANCELLED]: "Service was cancelled.",
    };

    // Notify via socket outside transaction
    const io = getSocket();
    io.emit(`progress-${paymentData._id}`, { paymentId: pId });

    io?.emit(`user-${paymentData.user}`, {
      message:
        statusMessages[statusData] || `Service status changed to ${statusData}`,
      paymentId: pId,
    });

    return newData;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

const seeServiceDetails = async (sId: string) => {
  const service = await Service.aggregate([
    {
      $match: {
        _id: new Types.ObjectId(sId),
      },
    },
    // Lookup for UserProfile
    {
      $lookup: {
        from: "userprofiles",
        localField: "user",
        foreignField: "user",
        as: "userProfile",
      },
    },
    { $unwind: { path: "$userProfile", preserveNullAndEmptyArrays: true } },

    // Lookup inside UserProfile → User
    {
      $lookup: {
        from: "users",
        localField: "userProfile.user",
        foreignField: "_id",
        as: "userProfile.user",
      },
    },
    {
      $unwind: { path: "$userProfile.user", preserveNullAndEmptyArrays: true },
    },

    // Project only required fields (✅ no mix of inclusion + exclusion)
    {
      $project: {
        issue: 1,
        description: 1,
        schedule: 1,
        //price: 1,
        "location.placeId": 1,
        "location.coordinates.coordinates": 1,
        "userProfile.fullName": 1,
        "userProfile.image": 1,
        // only keep the safe fields you want
        "userProfile.user._id": 1,
        "userProfile.user.email": 1,
        "userProfile.user.role": 1,
        "userProfile.carInfo": 1,
      },
    },
  ]);

  if (!service || service.length === 0) {
    throw new Error("Service not found");
  }

  const result = service[0];
  let userRating;

  if (result && result.userProfile.user._id) {
    console.log(result.userProfile.user._id);
    const ratingData = await UserRating.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(
            String(result.userProfile.user._id) as string
          ),
        },
      },
      {
        $group: {
          _id: "$user",
          averageRating: { $avg: "$rating" },
          totalRatings: { $sum: 1 },
        },
      },
    ]);
    userRating = ratingData[0] || {
      averageRating: 0,
      totalRatings: 0,
    };
  }
  console.log(userRating);
  return {
    ...result,
    location: {
      placeId: result.location.placeId,
      coordinates: result.location.coordinates.coordinates,
    },
    userRating: userRating,
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
  mechanicDetails,
  getMechanicRatings,
  cancelService,
  seeServiceDetails,

  getRunningService,
  getAllRequestedService,
  seeCurrentServiceProgress,
  pushNewServiceReq,
  addNewBidDataToService,
  changeServiceStatus,
  markServiceAsComplete,
  getUserRatings,
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
