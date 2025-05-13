import { Request, Response } from "express";

import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { ServiceService } from "./service.service";

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

const getBidListOfService = catchAsync(async (req: Request, res: Response) => {
  const { sId } = req.params;
  const result = await ServiceService.getBidListOfService(sId, req.user.userId);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Bid list of a Service retrieved successfully",
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
  getBidListOfService,

  cancelService,
};
