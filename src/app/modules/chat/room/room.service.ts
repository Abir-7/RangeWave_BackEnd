/* eslint-disable arrow-body-style */

import User from "../../users/user/user.model";
import ChatRoom from "./room.model";

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
const createRoom = async (users: [string, string]) => {
  // 1. Check if both users exist
  const foundUsers = await User.find({ _id: { $in: users } }).lean();

  if (foundUsers.length !== 2) {
    return "One or both users do not exist";
  }

  const existingRoom = await ChatRoom.findOne({
    users: { $all: users, $size: 2 },
  }).lean();

  if (existingRoom) {
    return existingRoom;
  }

  // 3. Create new chatroom if none found
  const newRoom = new ChatRoom({
    users,
  });

  await newRoom.save();

  return newRoom;
};

export const RoomService = {
  createRoom,
};
