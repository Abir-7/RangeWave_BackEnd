"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomService = exports.createRoomAfterHire = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const user_model_1 = __importDefault(require("../../users/user/user.model"));
const room_model_1 = __importDefault(require("./room.model"));
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
const createRoomAfterHire = (users, session) => __awaiter(void 0, void 0, void 0, function* () {
    // 1. Check if both users exist
    const foundUsers = yield user_model_1.default.find({ _id: { $in: users } })
        .session(session)
        .lean();
    if (foundUsers.length !== 2) {
        throw new Error("One or both users do not exist");
    }
    // 2. Check if room already exists
    const existingRoom = yield room_model_1.default.findOne({
        users: { $all: users, $size: 2 },
    })
        .session(session)
        .lean();
    if (existingRoom) {
        return existingRoom;
    }
    // 3. Create new chatroom if none found
    const newRoom = new room_model_1.default({
        users,
    });
    yield newRoom.save({ session });
    return newRoom;
});
exports.createRoomAfterHire = createRoomAfterHire;
// const getChatList = async (userId: string) => {
//   const data = await ChatRoom.aggregate([
//     {
//       $match: { users: new mongoose.Types.ObjectId(userId) },
//     },
//     {
//       $lookup: {
//         from: "users",
//         let: { userIds: "$users" },
//         pipeline: [
//           { $match: { $expr: { $in: ["$_id", "$$userIds"] } } },
//           {
//             $project: { _id: 1 },
//           },
//           {
//             $lookup: {
//               from: "mechanicprofiles",
//               let: { userId: "$_id" },
//               pipeline: [
//                 { $match: { $expr: { $eq: ["$user", "$$userId"] } } },
//                 { $project: { fullName: 1, _id: 0, email: 1, image: 1 } },
//               ],
//               as: "mechanicProfile",
//             },
//           },
//           {
//             $lookup: {
//               from: "userprofiles",
//               let: { userId: "$_id" },
//               pipeline: [
//                 { $match: { $expr: { $eq: ["$user", "$$userId"] } } },
//                 { $project: { fullName: 1, _id: 0, email: 1, image: 1 } },
//               ],
//               as: "userProfile",
//             },
//           },
//           {
//             $unwind: {
//               path: "$userProfile",
//               preserveNullAndEmptyArrays: true,
//             },
//           },
//           {
//             $unwind: {
//               path: "$mechanicProfile",
//               preserveNullAndEmptyArrays: true,
//             },
//           },
//           {
//             // Merge profiles into one field "profile"
//             $addFields: {
//               profile: {
//                 $cond: [
//                   { $ifNull: ["$mechanicProfile", false] },
//                   "$mechanicProfile",
//                   "$userProfile",
//                 ],
//               },
//             },
//           },
//           {
//             // Remove the original profile fields after merging
//             $project: {
//               userProfile: 0,
//               mechanicProfile: 0,
//             },
//           },
//         ],
//         as: "users",
//       },
//     },
//     {
//       $lookup: {
//         from: "messages",
//         localField: "lastMessage",
//         foreignField: "_id",
//         as: "lastMessage",
//       },
//     },
//     {
//       $sort: { updatedAt: -1 },
//     },
//   ]);
//   return data;
// };
const getChatList = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield room_model_1.default.aggregate([
        {
            $match: { users: new mongoose_1.default.Types.ObjectId(userId) },
        },
        {
            $lookup: {
                from: "users",
                let: { userIds: "$users" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $in: ["$_id", "$$userIds"] },
                                    { $ne: ["$_id", new mongoose_1.default.Types.ObjectId(userId)] }, // ✅ exclude current user
                                ],
                            },
                        },
                    },
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
});
exports.RoomService = {
    getChatList,
};
