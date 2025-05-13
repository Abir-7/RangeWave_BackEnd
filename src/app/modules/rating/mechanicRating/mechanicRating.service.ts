/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import status from "http-status";
import AppError from "../../../errors/AppError";
import User from "../../users/user/user.model";
import MechanicRating from "./mechanicRating.model";

const addRatingToMechanic = async (
  ratingData: {
    rating: number;
    mechanicId: string;
  },
  userId: string
) => {
  const mechanicData = await User.findOne({
    _id: ratingData.mechanicId,
    role: "MECHANIC",
  });

  if (!mechanicData) {
    throw new AppError(status.NOT_FOUND, "Mechanic not found.");
  }

  const newRating = await MechanicRating.create({
    ...ratingData,
    user: userId,
  });
  return newRating;
};

export const MechanicRatingService = { addRatingToMechanic };
