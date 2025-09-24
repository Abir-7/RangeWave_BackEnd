import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { BidService } from "./bid.service";

const addBid = catchAsync(async (req: Request, res: Response) => {
  const bidData = req.body;
  const result = await BidService.addBid(bidData, req.user.userId);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Bid added successfully",
    data: result,
  });
});

const declinedBid = catchAsync(async (req: Request, res: Response) => {
  const bidData = req.body;
  const result = await BidService.declinedBid(bidData, req.user.userId);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Bid declined successfully",
    data: result,
  });
});

const bidHistory = catchAsync(async (req: Request, res: Response) => {
  const bidData = req.body;
  const result = await BidService.bidHistory(req.user.userId);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Bid declined successfully",
    data: result,
  });
});

export const BidController = {
  addBid,
  declinedBid,
  bidHistory,
};
