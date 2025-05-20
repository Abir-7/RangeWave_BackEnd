/* eslint-disable @typescript-eslint/no-explicit-any */
import ChatRoom from "../room/room.model";
import Message from "./message.model";

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import mongoose from "mongoose";

const sendMessage = async (
  userId: string,
  data: { roomId: string; message: string }
) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Find the chat room by ID and check if userId is in users array
    const chatRoom = await ChatRoom.findOne({
      _id: data.roomId,
      users: userId,
    }).session(session);

    if (!chatRoom) {
      throw new Error("Chat room not found or user not authorized");
    }

    // Create the message within the transaction session
    const newMessage = await Message.create(
      [
        {
          sender: userId,
          ...data,
        },
      ],
      { session }
    );

    // Update chat room's lastMessage
    await ChatRoom.findByIdAndUpdate(
      data.roomId,
      { lastMessage: newMessage[0]._id },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return newMessage[0];
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    throw new Error(error);
  }
};

export const MessageService = {
  sendMessage,
};
