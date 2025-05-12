import { Request, Response } from "express";

import { ServiceService } from "../service.service";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";

const createService = catchAsync(async (req: Request, res: Response) => {
  const serviceData = req.body;
  const result = await ServiceService.createService(
    serviceData,
    req.user.userId
  );
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "Service created successfully",
    data: result,
  });
});

const getService = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ServiceService.getServiceById(id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Service retrieved successfully",
    data: result,
  });
});

const cancelService = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const serviceData = req.body;
  const result = await ServiceService.cancelService(id, serviceData);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Service updated successfully",
    data: result,
  });
});

export const ServiceController = {
  createService,

  getService,
  cancelService,
};
