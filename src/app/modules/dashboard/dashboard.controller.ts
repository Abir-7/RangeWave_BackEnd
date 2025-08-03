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

export const DashboardController = {
  dashboardData,
};
