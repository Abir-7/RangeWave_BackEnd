/* eslint-disable @typescript-eslint/no-explicit-any */
import status from "http-status";
import AppError from "../../../errors/AppError";
import ChatRoom from "../room/room.model";
import Message from "./message.model";

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import mongoose from "mongoose";
import { io } from "../../../socket/socket";
import { UserProfile } from "../../users/userProfile/userProfile.model";
import User from "../../users/user/user.model";
import { MechanicProfile } from "../../users/mechanicProfile/mechanicProfile.model";

const sendMessage = async (
  userId: string,
  data: { roomId: string; message: string }
) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Find the chat room by ID and check if userId is in users array
    const chatRoom = (await ChatRoom.findOne({
      _id: data.roomId,
      users: userId,
    }).session(session)) as any;

    if (!chatRoom) {
      throw new Error("Chat room not found or user not authorized");
    }

    // Create the message within the transaction session
    const newMessage = (await Message.create(
      [
        {
          sender: userId,
          ...data,
        },
      ],
      { session }
    )) as any;

    // Update chat room's lastMessage
    await ChatRoom.findByIdAndUpdate(
      data.roomId,
      { lastMessage: newMessage[0]._id },
      { session }
    );

    console.log(
      chatRoom.users
        .filter(
          (user: { toString: () => string }) => user.toString() !== userId
        )[0]
        .toString()
    );

    const reciverId = chatRoom.users
      .filter(
        (user: { toString: () => string }) => user.toString() !== userId
      )[0]
      .toString();

    const reciverUser = await User.findOne({ user: reciverId });

    let reciver;

    if (reciverUser?.role === "MECHANIC") {
      reciver = await MechanicProfile.findOne({ user: reciverId });
    } else {
      reciver = await UserProfile.findOne({ user: reciverId });
    }

    console.log(reciver);

    const socketData = {
      _id: chatRoom._id,
      users: [
        {
          _id: reciver?.user,
          profile: {
            fullName: reciver?.fullName || "",
            email: reciver?.email || "",
          },
        },
      ],
      createdAt: chatRoom.createdAt,
      updatedAt: chatRoom.createdAt,
      __v: 0,
      lastMessage: [
        {
          _id: newMessage[0]._id,
          roomId: newMessage[0].roomId.roomId,
          message: newMessage[0].message,
          sender: newMessage[0].sender,
          createdAt: newMessage[0].createdAt,
          updatedAt: newMessage[0].createdAt,
          __v: 0,
        },
      ],
    };

    io?.emit(`user-chat-list-${reciverId}`, socketData);

    await session.commitTransaction();
    session.endSession();

    return newMessage[0];
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    throw new Error(error);
  }
};

const getMessage = async (userId: string, roomId: string) => {
  const rooms = await ChatRoom.find({
    users: { $in: [userId] },
    _id: roomId,
  });

  if (!rooms) {
    throw new AppError(status.NOT_FOUND, "Chat room not found.");
  }

  const chatdata = await Message.find({ roomId });
  return chatdata;
};

export const MessageService = {
  sendMessage,
  getMessage,
};
