import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { PrivecyService } from "./termPrivecy.service";

const upsertPolicy = catchAsync(async (req: Request, res: Response) => {
  const { field, value } = req.body;
  const result = await PrivecyService.upsertPolicy(field, value);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: `${field} updated successfully`,
    data: result,
  });
});

const getPrivecy = catchAsync(async (req: Request, res: Response) => {
  const { field } = req.query as { field?: string };

  const result = await PrivecyService.getPrivecy(field as "term" | "privacy");

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Policy fetched successfully",
    data: result,
  });
});

export const PrivecyController = {
  upsertPolicy,
  getPrivecy,
};
