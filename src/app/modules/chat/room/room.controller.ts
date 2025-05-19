import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { RoomService } from "./room.service";

const createRoom = catchAsync(async (req: Request, res: Response) => {
  const result = await RoomService.createRoom(req.body);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Room created successfully",
    data: result,
  });
});

export const RoomController = {
  createRoom,
};
