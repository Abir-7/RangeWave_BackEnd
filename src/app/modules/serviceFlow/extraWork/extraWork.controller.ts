import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { ExtraWorkService } from "./extraWork.service";

const reqForExtraWork = catchAsync(async (req: Request, res: Response) => {
  const { idData, data } = req.body;

  const result = await ExtraWorkService.reqForExtraWork(idData, data);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Request for extra work is send to user.",
    data: result,
  });
});

const rejectReqForExtrawork = catchAsync(
  async (req: Request, res: Response) => {
    const { sId } = req.params;

    const result = await ExtraWorkService.rejectReqForExtrawork(sId);
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Request for extra work is rejected",
      data: result,
    });
  }
);

const acceptReqForExtrawork = catchAsync(
  async (req: Request, res: Response) => {
    const { sId } = req.params;

    const result = await ExtraWorkService.acceptReqForExtrawork(sId);
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Request for extra work is accepted.",
      data: result,
    });
  }
);

export const ExtraWorkController = {
  reqForExtraWork,
  rejectReqForExtrawork,
  acceptReqForExtrawork,
};
