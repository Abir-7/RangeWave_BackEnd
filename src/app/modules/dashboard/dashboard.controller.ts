/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";

import { DashboardService } from "./dashboard.service";

const dashboardData = catchAsync(async (req: Request, res: Response) => {
  const result = await DashboardService.dashboardData();
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Dashboard data is fetched successfully",
    data: result,
  });
});
const paymentHistory = catchAsync(async (req: Request, res: Response) => {
  const result = await DashboardService.paymentHistory();
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Payment history fetched successfully",
    data: result,
  });
});
const getUsersByRole = catchAsync(async (req: Request, res: Response) => {
  const result = await DashboardService.getUsersByRole(req.query.role as any);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "User data fetched successfully",
    data: result,
  });
});

export const DashboardController = {
  dashboardData,
  paymentHistory,
  getUsersByRole,
};
