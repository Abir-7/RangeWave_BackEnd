import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { RoomService } from "./room.service";

const getChatList = catchAsync(async (req: Request, res: Response) => {
  const result = await RoomService.getChatList(req.user.userId);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Chat list fetched successfully",
    data: result,
  });
});

export const RoomController = {
  getChatList,
};
