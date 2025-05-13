/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import status from "http-status";
import AppError from "../../../errors/AppError";
import User from "../../users/user/user.model";
import UserRating from "./userRating.model";

const addRatingToUser = async (
  ratingData: {
    rating: number;
    user: string;
  },
  mechanicId: string
) => {
  const userData = await User.findOne({
    _id: ratingData.user,
    role: "USER",
  });

  if (!userData) {
    throw new AppError(status.NOT_FOUND, "User not found.");
  }

  const newRating = await UserRating.create({
    ...ratingData,
    mechanicId: mechanicId,
  });
  return newRating;
};

export const UserRatingService = { addRatingToUser };
