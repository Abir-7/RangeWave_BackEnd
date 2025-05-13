import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync";
import { UserRatingService } from "./userRating.service";
import sendResponse from "../../../utils/sendResponse";

const addRatingToUser = catchAsync(async (req: Request, res: Response) => {
  const ratingData = req.body;
  const result = await UserRatingService.addRatingToUser(
    ratingData,
    req.user.userId
  );
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Rating given successfully",
    data: result,
  });
});

export const UserRatingController = {
  addRatingToUser,
};
