import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { ExtraWorkService } from "./extraWork.service";

const reqForExtraWork = catchAsync(async (req: Request, res: Response) => {
  const { sId } = req.params;

  const result = await ExtraWorkService.reqForExtraWork(sId, req.body);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Request for extra work is send to user.",
    data: result,
  });
});

export const ExtraWorkController = {
  reqForExtraWork,
};
