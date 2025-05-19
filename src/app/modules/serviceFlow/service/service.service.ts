/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import Service from "./service.model";
import { IService, Status } from "./service.interface";
import Bid from "../bid/bid.model";
import { BidStatus } from "../bid/bid.interface";
import { StripeService } from "../../stripe/stripe.service";

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
  console.log(coords1, coords2);

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
const hireMechanic = async (bidId: string, userId: string) => {
  const bidData = await Bid.findOne({
    _id: bidId,
    status: BidStatus.provided,
  })
    .populate("reqServiceId")
    .lean();

  if (!bidData) {
    throw new Error("Bid not found");
  }

  const serviceData = await Service.findOne({
    _id: bidData.reqServiceId._id,
    user: userId,
  });

  if (serviceData?.status !== Status.FINDING) {
    throw new Error("Service not found.");
  }

  serviceData.status = Status.UNPAID;
  await serviceData.save();

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

// for mechanics
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

export const ServiceService = {
  addServiceReq,
  getBidListOfService,
  hireMechanic,
  cancelService,
  seeServiceDetails,
};
