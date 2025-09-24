import { UserProfile } from "./../../users/userProfile/userProfile.model";
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import status from "http-status";
import AppError from "../../../errors/AppError";

import { BidStatus } from "./bid.interface";

import { Status } from "../service/service.interface";
import { Service } from "../service/service.model";
import { getSocket } from "../../../socket/socket";
import { MechanicProfile } from "../../users/mechanicProfile/mechanicProfile.model";

import { Bid } from "./bid.model";
import mongoose from "mongoose";
//import { MechanicProfile } from "../../users/mechanicProfile/mechanicProfile.model";

const addBid = async (
  bidData: {
    price: number;
    reqServiceId: string;
    coordinates: number;
    placeId: string;
  },
  userId: string
) => {
  const isServiceExist = await Service.findOne({
    _id: bidData.reqServiceId,
    status: Status.FINDING,
  });

  const mechaniceProfile = await MechanicProfile.findOne({ user: userId });

  if (!mechaniceProfile) {
    throw new AppError(
      status.NOT_FOUND,
      "Profile or stripe account id not found."
    );
  }

  if (mechaniceProfile.isNeedToPayForWorkShop) {
    throw new AppError(
      status.BAD_REQUEST,
      "Another mechanics with workshop open account before you near your location. So you have to pay for one time.After pay you can bid."
    );
  }

  if (!isServiceExist) {
    throw new AppError(status.NOT_FOUND, "Service req not found");
  }

  const findBid = await Bid.findOne({
    mechanicId: userId,
    reqServiceId: bidData.reqServiceId,
  });

  if (findBid?.status === BidStatus.declined) {
    throw new AppError(status.BAD_REQUEST, "You already declined.");
  }

  if (findBid?.status === BidStatus.provided) {
    throw new AppError(status.BAD_REQUEST, "You already add bid.");
  }

  const saveBid = await Bid.create({
    price: bidData.price,
    reqServiceId: bidData.reqServiceId,

    location: {
      placeId: bidData.placeId,
      coordinates: {
        type: "Point",
        coordinates: bidData.coordinates,
      },
    },

    mechanicId: userId,
    status: BidStatus.provided,
    extraWork: {
      price: 0,
      description: "",
      issue: "",
    },
  });

  const io = getSocket();

  const userProfile = await UserProfile.findOne({ user: isServiceExist.user });

  const bidWithUserProfile = {
    ...saveBid.toObject(), // converts Mongoose doc to plain object
    userProfile,
  };

  io.emit(`service-${saveBid.reqServiceId}`, {
    serviceId: saveBid.reqServiceId,
  });

  return bidWithUserProfile;
};

const declinedBid = async (
  bidData: { reqServiceId: string },
  userId: string
) => {
  const isServiceExist = await Service.findOne({
    _id: bidData.reqServiceId,
    status: Status.FINDING,
  });

  if (!isServiceExist) {
    throw new AppError(status.NOT_FOUND, "Service req not found");
  }

  const findBid = await Bid.findOne({
    mechanicId: userId,
    reqServiceId: bidData.reqServiceId,
  });

  if (findBid?.status === BidStatus.declined) {
    throw new AppError(status.BAD_REQUEST, "You already declined.");
  }

  if (findBid?.status === BidStatus.provided) {
    throw new AppError(status.BAD_REQUEST, "You already add bid.");
  }

  const service = await Bid.create({
    ...bidData,
    price: 0,
    mechanicId: userId,
    status: BidStatus.declined,
    extraWork: {
      price: 0,
      description: "",
      issue: "",
    },
  });
  return service;
};

const bidHistory = async (mechanicId: string) => {
  const mechanicObjectId = new mongoose.Types.ObjectId(mechanicId);

  const data = await Bid.aggregate([
    // 1. Only bids by this mechanic with status = "provided"
    { $match: { mechanicId: mechanicObjectId, status: "provided" } },

    // 2. Lookup payment for this bid
    {
      $lookup: {
        from: "payments",
        localField: "_id",
        foreignField: "bidId",
        as: "payment",
      },
    },
    { $unwind: { path: "$payment", preserveNullAndEmptyArrays: true } },

    // 3. Lookup service details
    {
      $lookup: {
        from: "services",
        localField: "reqServiceId",
        foreignField: "_id",
        as: "service",
      },
    },
    { $unwind: "$service" },

    // 4. Lookup user profile of the service creator
    {
      $lookup: {
        from: "userprofiles",
        localField: "service.user",
        foreignField: "user",
        as: "user",
      },
    },
    { $unwind: "$user" },

    // 5. Project the final structure
    {
      $project: {
        isAccepted: { $cond: [{ $ifNull: ["$payment", false] }, true, false] },
        bid: "$$ROOT",
        service: "$service",
        user: "$user",
        payment: "$payment",
      },
    },
  ]);

  return data;
};

export const BidService = {
  addBid,
  declinedBid,
  bidHistory,
};
