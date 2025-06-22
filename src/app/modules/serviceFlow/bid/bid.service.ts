import status from "http-status";
import AppError from "../../../errors/AppError";

import { BidStatus, IBid } from "./bid.interface";
import Bid from "./bid.model";
import { Status } from "../service/service.interface";
import { Service } from "../service/service.model";
import { getSocket } from "../../../socket/socket";
import { MechanicProfile } from "../../users/mechanicProfile/mechanicProfile.model";

const addBid = async (
  bidData: {
    price: number;
    reqServiceId: string;
    coordinates: number;
    placeId: string;
  },
  userId: string
): Promise<IBid> => {
  const isServiceExist = await Service.findOne({
    _id: bidData.reqServiceId,
    status: Status.FINDING,
  });

  const mechaniceProfile = await MechanicProfile.findOne({ user: userId });

  if (!mechaniceProfile || mechaniceProfile.stripeAccountId) {
    throw new AppError(
      status.NOT_FOUND,
      "Profile or stripe account id not found."
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
  });

  const io = getSocket();

  io.emit("new-bid", { serviceId: saveBid._id });

  return saveBid;
};

const declinedBid = async (
  bidData: { reqServiceId: string },
  userId: string
): Promise<IBid> => {
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
  });
  return service;
};

export const BidService = {
  addBid,
  declinedBid,
};
