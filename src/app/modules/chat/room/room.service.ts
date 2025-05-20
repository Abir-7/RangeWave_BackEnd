import mongoose from "mongoose";
import User from "../../users/user/user.model";
import ChatRoom from "./room.model";

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

export const createRoomAfterHire = async (
  users: [string, string],
  session: mongoose.ClientSession
) => {
  // 1. Check if both users exist
  const foundUsers = await User.find({ _id: { $in: users } })
    .session(session)
    .lean();

  if (foundUsers.length !== 2) {
    throw new Error("One or both users do not exist");
  }

  // 2. Check if room already exists
  const existingRoom = await ChatRoom.findOne({
    users: { $all: users, $size: 2 },
  })
    .session(session)
    .lean();

  if (existingRoom) {
    return existingRoom;
  }

  // 3. Create new chatroom if none found
  const newRoom = new ChatRoom({
    users,
  });

  await newRoom.save({ session });

  return newRoom;
};

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
const getChatList = async (userId: string) => {
  const data = await ChatRoom.aggregate([
    {
      $match: { users: new mongoose.Types.ObjectId(userId) },
    },
    {
      $lookup: {
        from: "users",
        let: { userIds: "$users" },
        pipeline: [
          { $match: { $expr: { $in: ["$_id", "$$userIds"] } } },
          {
            $project: { _id: 1 },
          },
          {
            $lookup: {
              from: "mechanicprofiles",
              let: { userId: "$_id" },
              pipeline: [
                { $match: { $expr: { $eq: ["$user", "$$userId"] } } },
                { $project: { fullName: 1, _id: 0, email: 1, image: 1 } },
              ],
              as: "mechanicProfile",
            },
          },
          {
            $lookup: {
              from: "userprofiles",
              let: { userId: "$_id" },
              pipeline: [
                { $match: { $expr: { $eq: ["$user", "$$userId"] } } },
                { $project: { fullName: 1, _id: 0, email: 1, image: 1 } },
              ],
              as: "userProfile",
            },
          },

          {
            $unwind: {
              path: "$userProfile",

              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $unwind: {
              path: "$mechanicProfile",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            // Merge profiles into one field "profile"
            $addFields: {
              profile: {
                $cond: [
                  { $ifNull: ["$mechanicProfile", false] },
                  "$mechanicProfile",
                  "$userProfile",
                ],
              },
            },
          },
          {
            // Remove the original profile fields after merging
            $project: {
              userProfile: 0,
              mechanicProfile: 0,
            },
          },
        ],
        as: "users",
      },
    },
    {
      $lookup: {
        from: "messages",
        localField: "lastMessage",
        foreignField: "_id",
        as: "lastMessage",
      },
    },
    {
      $sort: { updatedAt: -1 },
    },
  ]);

  return data;
};

export const RoomService = {
  createRoom,
  getChatList,
};
