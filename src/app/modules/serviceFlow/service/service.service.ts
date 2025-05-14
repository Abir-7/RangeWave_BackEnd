/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import Service from "./service.model";
import { IService, Status } from "./service.interface";
import Bid from "../bid/bid.model";
import { BidStatus } from "../bid/bid.interface";
import { UserProfile } from "../../users/userProfile/userProfile.model";
import { MechanicProfile } from "../../users/mechanicProfile/mechanicProfile.model";
import MechanicRating from "../../rating/mechanicRating/mechanicRating.model";
import { IMechanicProfile } from "../../users/mechanicProfile/mechanicProfile.interface";

const createService = async (
  serviceData: Partial<IService>,
  userId: string
): Promise<IService> => {
  const service = await Service.create({ ...serviceData, user: userId });
  return service;
};

const getDistance = (
  coords1: [number, number],
  coords2: [number, number]
): number => {
  const R = 6371; // Earth radius in km

  // Swap the order to match (longitude, latitude)
  const [lon1, lat1] = coords1; // Longitude, Latitude for point 1
  const [lon2, lat2] = coords2; // Longitude, Latitude for point 2

  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Number((R * c).toFixed(2)); // Distance in kilometers
};

const getBidListOfService = async (serviceId: string, userId: string) => {
  // Step 1: Fetch the service with the required status and user
  const service = await Service.findOne({
    _id: serviceId,
    status: Status.FINDING,
    user: userId,
  });

  if (!service) {
    throw new Error("Service not found");
  }

  // Step 2: Fetch user profile and ensure location coordinates are present
  const userProfile = await UserProfile.findOne({ user: userId });
  if (!userProfile || !userProfile.location?.coordinates?.coordinates) {
    throw new Error("User location not found");
  }

  // Step 3: Fetch all bids for the service
  const bids = await Bid.find({
    reqServiceId: serviceId,
    status: BidStatus.provided,
  }); // Use populate to retrieve mechanic data in a single query

  // Step 4: Fetch mechanic ratings in one batch
  const mechanicRatings = await MechanicRating.aggregate([
    {
      $match: { mechanicId: { $in: bids.map((bid) => bid.mechanicId._id) } },
    },
    {
      $group: {
        _id: "$mechanicId",
        avgRating: { $avg: "$rating" },
      },
    },
  ]);

  // Step 5: Create a map of mechanic ratings for quick lookup
  const mechanicRatingsMap = mechanicRatings.reduce(
    (acc, { _id, avgRating }) => {
      acc[_id] = avgRating;
      return acc;
    },
    {} as Record<string, number>
  );

  // Step 6: Preload all mechanic profiles in a single batch
  const mechanicProfiles = await MechanicProfile.find({
    user: { $in: bids.map((bid) => bid.mechanicId._id) },
  });

  // Step 7: Create a map of mechanic profiles for quick lookup
  const mechanicProfilesMap = mechanicProfiles.reduce((acc, profile) => {
    acc[profile.user.toString()] = profile;
    return acc;
  }, {} as Record<string, IMechanicProfile>);

  // Step 8: Calculate distance and augment bids with relevant details
  const bidsWithDetails = bids.map((bid) => {
    const mechanicProfile = mechanicProfilesMap[bid.mechanicId._id.toString()];
    const mechanicRating =
      mechanicRatingsMap[bid.mechanicId._id.toString()] || 0;
    const distance = getDistance(
      (userProfile.location?.coordinates.coordinates as [number, number]) || [
        0, 0,
      ],
      mechanicProfile.location.coordinates.coordinates as [number, number]
    );

    return {
      ...bid.toObject(),
      mechanicProfile: {
        user: mechanicProfile.user,
        fullName: mechanicProfile.fullName,
        image: mechanicProfile.image,
        phoneNumber: mechanicProfile.phoneNumber,
        email: mechanicProfile.email,
      },
      avgRating: mechanicRating,
      distance,
    };
  });

  return bidsWithDetails;
};

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
  console.log(bidData.reqServiceId);

  const serviceData = await Service.findOne({
    _id: bidData.reqServiceId._id,
    user: userId,
  });

  if (serviceData?.status !== Status.FINDING) {
    throw new Error("Service not found.");
  }

  serviceData.status = Status.WAITING;
  await serviceData.save();
  return { ...bidData, reqServiceId: serviceData.toObject() };
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

// for socket-------------------
export const sendBidTouser = async (
  serviceId: string,
  userId: string,
  mechanicId: string
) => {
  // Find the service with the specific serviceId and userId
  const service = await Service.findOne({
    _id: serviceId,
    status: Status.FINDING,
    user: userId,
  });

  if (!service) {
    throw new Error("Service not found");
  }

  // Fetch the user profile and check for location data
  const userProfile = await UserProfile.findOne({ user: userId });
  if (!userProfile || !userProfile.location?.coordinates.coordinates) {
    throw new Error("User location not found");
  }

  // Find the bid made by the specific mechanic
  const bid = await Bid.findOne({
    reqServiceId: serviceId,
    mechanicId: mechanicId,
    status: BidStatus.provided,
  });

  if (!bid) {
    throw new Error("No bid found for the specified mechanic");
  }

  // Get the mechanic's rating
  const mechanicRating = await MechanicRating.aggregate([
    { $match: { mechanicId: mechanicId } },
    {
      $group: {
        _id: "$mechanicId",
        avgRating: { $avg: "$rating" },
      },
    },
  ]);

  const mechanicRatingMap =
    mechanicRating.length > 0 ? mechanicRating[0].avgRating : 0;

  // Fetch mechanic profile details
  const mechanicProfile = await MechanicProfile.findOne({
    user: bid.mechanicId,
  });

  if (!mechanicProfile || !mechanicProfile.location?.coordinates) {
    throw new Error("Mechanic location not found");
  }

  // Calculate the distance
  const distance = getDistance(
    (userProfile.location?.coordinates.coordinates as [number, number]) || [
      0, 0,
    ],
    mechanicProfile.location.coordinates.coordinates as [number, number]
  );

  // Return the bid with additional details
  return {
    ...bid.toObject(),
    mechanicProfile: {
      user: mechanicProfile.user,
      fullName: mechanicProfile.fullName,
      image: mechanicProfile.image,
      phoneNumber: mechanicProfile.phoneNumber,
      email: mechanicProfile.email,
    },
    avgRating: mechanicRatingMap,
    distance,
  };
};

export const ServiceService = {
  createService,
  getBidListOfService,
  hireMechanic,
  cancelService,
};
