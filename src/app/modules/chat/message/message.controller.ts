import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { MessageService } from "./message.service";

const sendMessage = catchAsync(async (req: Request, res: Response) => {
  const result = await MessageService.sendMessage(req.user.userId, req.body);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Message send successfully",
    data: result,
  });
});
const getMessage = catchAsync(async (req: Request, res: Response) => {
  const result = await MessageService.getMessage(
    req.user.userId,
    req.params.roomId
  );
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Message are fetched successfully",
    data: result,
  });
});

export const MessageController = {
  sendMessage,
  getMessage,
};
