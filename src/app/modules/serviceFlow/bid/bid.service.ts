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
import { stripe } from "../../stripe/stripe";
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

  if (mechaniceProfile?.stripeAccountId) {
    const account = await stripe.accounts.retrieve(
      mechaniceProfile?.stripeAccountId
    );
    const canReceivePayments =
      account.charges_enabled && account.payouts_enabled;

    if (!canReceivePayments) {
      throw new AppError(
        500,
        "Stripe account not configured correctly. Try again to connect & verify."
      );
    }
  }

  if (!mechaniceProfile?.stripeAccountId) {
    throw new AppError(500, "You have to add a stripe account from profile.");
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

  const bids = await Bid.aggregate([
    // Filter bids for this mechanic
    { $match: { mechanicId: mechanicObjectId } },

    // Exclude declined bids
    { $match: { status: { $ne: "declined" } } },

    // Lookup corresponding payments
    {
      $lookup: {
        from: "payments",
        let: { bidId: "$_id", serviceId: "$reqServiceId" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$serviceId", "$$serviceId"] },
                  { $eq: ["$mechanicId", mechanicObjectId] },
                ],
              },
            },
          },
        ],
        as: "payments",
      },
    },

    // Lookup the service for this bid
    {
      $lookup: {
        from: "services",
        localField: "reqServiceId",
        foreignField: "_id",
        as: "service",
      },
    },
    { $unwind: "$service" },

    // Lookup user profile of the service requester
    {
      $lookup: {
        from: "userprofiles",
        localField: "service.user",
        foreignField: "user",
        as: "userProfile",
      },
    },
    { $unwind: { path: "$userProfile", preserveNullAndEmptyArrays: true } },

    // Add customerStatus based on payments
    {
      $addFields: {
        customerStatus: {
          $cond: [
            { $eq: [{ $size: "$payments" }, 0] },
            "pending",
            {
              $cond: [
                {
                  $anyElementTrue: {
                    $map: {
                      input: "$payments",
                      as: "p",
                      in: { $eq: ["$$p.bidId", "$_id"] },
                    },
                  },
                },
                "accepted",
                "rejected",
              ],
            },
          ],
        },
      },
    },

    // Sort latest bids first
    { $sort: { createdAt: -1 } },
  ]);

  const formattedBids = bids.map((bid) => ({
    _id: bid._id,
    price: bid.price,
    reqServiceId: bid.reqServiceId,
    mechanicId: bid.mechanicId,
    status: bid.status,
    customerStatus: bid.customerStatus,
    service: {
      _id: bid.service._id,
      issue: bid.service.issue,
      description: bid.service.description,
    },
    userProfile: {
      _id: bid.userProfile?._id || null,
      fullName: bid.userProfile?.fullName || "",
      email: bid.userProfile?.email || "",
      image: bid.userProfile?.image || "",
    },
  }));

  return formattedBids;
};

export const BidService = {
  addBid,
  declinedBid,
  bidHistory,
};
