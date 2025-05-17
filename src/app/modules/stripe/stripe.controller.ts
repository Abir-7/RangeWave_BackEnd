import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { StripeService } from "./stripe.service";

const createAndConnect = catchAsync(async (req: Request, res: Response) => {
  const { mechanicId } = req.body;
  const result = await StripeService.createAndConnect(mechanicId);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Success",
    data: result,
  });
});

export const StripeController = { createAndConnect };
