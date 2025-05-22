/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from "mongoose";
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { ExtraWork, Service } from "./service.model";
import { IService, Status } from "./service.interface";
import Bid from "../bid/bid.model";
import { BidStatus } from "../bid/bid.interface";
import { StripeService } from "../../stripe/stripe.service";
import { createRoomAfterHire } from "../../chat/room/room.service";

// ------------------------------------for users-------------------------------//

const addServiceReq = async (
  serviceData: {
    issue: string;
    description: string;
    location: {
      placeId: string;
      coordinates: number[];
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

  // Query to find if any service exists with given statuses for this user today
  const existingService = await Service.findOne({
    user: userId,
    status: { $in: [Status.FINDING, Status.WORKING, Status.WAITING] },
    createdAt: { $gte: startOfDay, $lte: endOfDay },
  });

  if (existingService) {
    throw new Error(
      "You already have an active service request today with status finding, working, or waiting."
    );
  }

  // If no conflict, create the new service
  const service = await Service.create({
    ...serviceData,
    user: userId,
    location,
  });
  return service;
};
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
  return bids.map((bid) => {
    const coords =
      bid.mechanicProfile?.workshop?.location?.coordinates?.coordinates;

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
};

// call payment intent function from stripe.service.ts file
import AppError from "../../../errors/AppError";
import status from "http-status";
import User from "../../users/user/user.model";

const hireMechanic = async (bidId: string, userId: string) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Find the bid inside the transaction session
    const bidData = await Bid.findOne({
      _id: bidId,
      status: BidStatus.provided,
    })
      .populate("reqServiceId")
      .session(session) // <-- important to include session
      .lean();

    if (!bidData) {
      throw new Error("Bid not found");
    }

    // Find the service with session
    const serviceData = await Service.findOne({
      _id: bidData.reqServiceId._id,
      user: userId,
    }).session(session);

    if (!serviceData || serviceData.status !== Status.FINDING) {
      throw new Error("Service not found.");
    }

    // Update the service status inside transaction
    serviceData.status = Status.UNPAID;
    await serviceData.save({ session });

    // Create the room inside transaction - you need to support session in RoomService
    const users = [userId.toString(), bidData.mechanicId.toString()] as [
      string,
      string
    ];

    // Assuming you modify createRoom to accept session or it internally uses session
    await createRoomAfterHire(users, session);

    // Commit the transaction before calling external payment
    await session.commitTransaction();
    session.endSession();

    // Call the external Stripe service (outside transaction)
    const paymentIntent = await StripeService.createPaymentIntent(bidId);

    return {
      ...bidData,
      reqServiceId: {
        ...serviceData.toObject(),
        location: {
          coordinates: serviceData.location.coordinates.coordinates,
          placeId: serviceData.location.placeId,
        },
      },
      paymentIntent,
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const cancelService = async (
  id: string,
  serviceData: Partial<IService>
): Promise<IService> => {
  const service = await Service.findByIdAndUpdate(id, serviceData, {
    new: true,
  });
  if (!service) {
    throw new Error("Service not found");
  }
  return service;
};

// ------------------------------------for mechanics and users-------------------------------//

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

    if (bidData && bidData.reqServiceId._id) {
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

export const ServiceService = {
  addServiceReq,
  getBidListOfService,
  hireMechanic,
  cancelService,
  seeServiceDetails,
  reqForExtraWork,
  getRunningService,
};
