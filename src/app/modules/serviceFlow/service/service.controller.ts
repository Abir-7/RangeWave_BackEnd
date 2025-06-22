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

const checkServiceStatusFinding = catchAsync(
  async (req: Request, res: Response) => {
    const result = await ServiceService.checkServiceStatusFinding(
      req.user.userId
    );
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Service with status finding fetched successfully",
      data: result,
    });
  }
);

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
  const result = await ServiceService.hireMechanic(req.body, req.user.userId);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "A mechanic is hired successfully",
    data: result,
  });
});

const markServiceAsComplete = catchAsync(
  async (req: Request, res: Response) => {
    const { pId } = req.params;

    const result = await ServiceService.markServiceAsComplete(pId);
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Mark as completed.",
      data: result,
    });
  }
);

//---------------------------- For Both Mechanics and Users-----------------------------//

const getRunningService = catchAsync(async (req: Request, res: Response) => {
  const result = await ServiceService.getRunningService(req.user.userId);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Current Service data is fetched successfully",
    data: result,
  });
});

const seeCurrentServiceProgress = catchAsync(
  async (req: Request, res: Response) => {
    const result = await ServiceService.seeCurrentServiceProgress(
      req.params.pId
    );
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Current Service progress data is fetched successfully",
      data: result,
    });
  }
);

const cancelService = catchAsync(async (req: Request, res: Response) => {
  const { pId } = req.params;
  const serviceData = req.body;
  const result = await ServiceService.cancelService(pId, serviceData);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Service updated successfully",
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

const changeServiceStatus = catchAsync(async (req: Request, res: Response) => {
  const { pId } = req.params;

  const result = await ServiceService.changeServiceStatus(pId);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Service status is changed successfully",
    data: result,
  });
});

//for socket
const pushNewServiceReq = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await ServiceService.pushNewServiceReq(id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "new service request is fetched.",
    data: result,
  });
});

const addNewBidDataToService = catchAsync(
  async (req: Request, res: Response) => {
    const { sId, bId } = req.params;
    const result = await ServiceService.addNewBidDataToService(
      sId,
      req.user.userId,
      bId
    );
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "new bid data is fetch for the service",
      data: result,
    });
  }
);

export const ServiceController = {
  addServiceReq,
  checkServiceStatusFinding,
  getBidListOfService,
  hireMechanic,
  cancelService,

  seeServiceDetails,

  getRunningService,
  seeCurrentServiceProgress,
  getAllRequestedService,

  pushNewServiceReq,
  addNewBidDataToService,
  changeServiceStatus,
  markServiceAsComplete,
};
