import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { MechanicRatingService } from "./mechanicRating.service";

const addRatingToMechanic = catchAsync(async (req: Request, res: Response) => {
  const ratingData = req.body;
  const result = await MechanicRatingService.addRatingToMechanic(
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

export const MechanicRatingController = {
  addRatingToMechanic,
};
