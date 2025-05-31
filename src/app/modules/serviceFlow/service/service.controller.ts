import { Request, Response } from "express";

import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { ServiceService } from "./service.service";
//--------------------------------- For Users -----------------------------------------//
const addServiceReq = catchAsync(async (req: Request, res: Response) => {
  const serviceData = req.body;
  const result = await ServiceService.addServiceReq(
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
const hireMechanic = catchAsync(async (req: Request, res: Response) => {
  const { bidId } = req.body;
  const result = await ServiceService.hireMechanic(bidId, req.user.userId);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "A mechanic is fired successfully",
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
//-------------------------------- For Both Mechanics and Users-------------------------------------------//
const getRunningService = catchAsync(async (req: Request, res: Response) => {
  const result = await ServiceService.getRunningService(req.user.userId);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Current Service data is fetched successfully",
    data: result,
  });
});
//--------------------------------- For Mechanics -----------------------------------------//

const getAllRequestedService = catchAsync(
  async (req: Request, res: Response) => {
    const result = await ServiceService.getAllRequestedService();
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Service req list is fetched successfully",
      data: result,
    });
  }
);
const seeServiceDetails = catchAsync(async (req: Request, res: Response) => {
  const { sId } = req.params;

  const result = await ServiceService.seeServiceDetails(sId);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Service details is fetched successfully",
    data: result,
  });
});
const reqForExtraWork = catchAsync(async (req: Request, res: Response) => {
  const { sId } = req.params;

  const result = await ServiceService.reqForExtraWork(sId, req.body);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Service details is fetched successfully",
    data: result,
  });
});

export const ServiceController = {
  addServiceReq,
  getBidListOfService,
  hireMechanic,
  cancelService,
  seeServiceDetails,
  reqForExtraWork,
  getRunningService,
  getAllRequestedService,
};
