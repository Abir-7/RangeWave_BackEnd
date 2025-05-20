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

export const MessageController = {
  sendMessage,
};
