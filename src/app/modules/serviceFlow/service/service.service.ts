import Service from "./service.model";
import { IService, Status } from "./service.interface";
import Bid from "../bid/bid.model";
import { IBid } from "../bid/bid.interface";

const createService = async (
  serviceData: Partial<IService>,
  userId: string
): Promise<IService> => {
  const service = await Service.create({ ...serviceData, user: userId });
  return service;
};

const getBidListOfService = async (
  id: string,
  userId: string
): Promise<IBid[]> => {
  const service = await Service.findOne({
    _id: id,
    status: Status.FINDING,
    user: userId,
  });
  if (!service) {
    throw new Error("Service not found");
  }

  const bidList = await Bid.aggregate([
    {
      $match: {
        reqServiceId: service._id,
      },
    },
    {
      $lookup: {
        from: "users", // Assuming "users" is the collection for mechanics
        localField: "mechanicId",
        foreignField: "_id",
        as: "mechanic",
      },
    },
    {
      $unwind: "$mechanic",
    },
    {
      $lookup: {
        from: "mechanicratings", // Assuming "mechanicratings" is the collection for ratings
        localField: "mechanicId",
        foreignField: "mechanicId",
        as: "ratings",
      },
    },
    {
      $addFields: {
        avgRating: {
          $cond: {
            if: { $eq: [{ $size: "$ratings" }, 0] },
            then: null, // No ratings available
            else: { $avg: "$ratings.rating" }, // Calculate average rating
          },
        },
      },
    },
    {
      $project: {
        mechanic: 1,
        reqServiceId: 1,
        avgRating: 1,
      },
    },
  ]);
  return bidList;
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

export const ServiceService = {
  createService,
  getBidListOfService,
  cancelService,
};
