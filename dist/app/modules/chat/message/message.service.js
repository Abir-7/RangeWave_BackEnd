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
exports.MessageService = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = __importDefault(require("../../../errors/AppError"));
const room_model_1 = __importDefault(require("../room/room.model"));
const message_model_1 = __importDefault(require("./message.model"));
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
const mongoose_1 = __importDefault(require("mongoose"));
const socket_1 = require("../../../socket/socket");
const userProfile_model_1 = require("../../users/userProfile/userProfile.model");
const user_model_1 = __importDefault(require("../../users/user/user.model"));
const mechanicProfile_model_1 = require("../../users/mechanicProfile/mechanicProfile.model");
const sendMessage = (userId, data) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession();
    try {
        session.startTransaction();
        // Find the chat room by ID and check if userId is in users array
        const chatRoom = (yield room_model_1.default.findOne({
            _id: data.roomId,
            users: userId,
        }).session(session));
        if (!chatRoom) {
            throw new Error("Chat room not found or user not authorized");
        }
        // Create the message within the transaction session
        const newMessage = (yield message_model_1.default.create([
            Object.assign({ sender: userId }, data),
        ], { session }));
        // Update chat room's lastMessage
        yield room_model_1.default.findByIdAndUpdate(data.roomId, { lastMessage: newMessage[0]._id }, { session });
        const reciverId = chatRoom.users
            .filter((user) => user.toString() !== userId)[0]
            .toString();
        const reciverUser = yield user_model_1.default.findOne({ _id: userId });
        let reciver;
        if ((reciverUser === null || reciverUser === void 0 ? void 0 : reciverUser.role) === "MECHANIC") {
            reciver = yield mechanicProfile_model_1.MechanicProfile.findOne({ user: userId });
        }
        else {
            reciver = yield userProfile_model_1.UserProfile.findOne({ user: userId });
        }
        const socketData = {
            _id: chatRoom._id,
            users: [
                {
                    _id: reciver === null || reciver === void 0 ? void 0 : reciver.user,
                    profile: {
                        fullName: (reciver === null || reciver === void 0 ? void 0 : reciver.fullName) || "",
                        email: (reciver === null || reciver === void 0 ? void 0 : reciver.email) || "",
                    },
                },
            ],
            createdAt: chatRoom.createdAt,
            updatedAt: chatRoom.createdAt,
            __v: 0,
            lastMessage: [
                {
                    _id: newMessage[0]._id,
                    roomId: newMessage[0].roomId,
                    message: newMessage[0].message,
                    sender: newMessage[0].sender,
                    createdAt: newMessage[0].createdAt,
                    updatedAt: newMessage[0].createdAt,
                    __v: 0,
                },
            ],
        };
        socket_1.io === null || socket_1.io === void 0 ? void 0 : socket_1.io.emit(`user-chat-list-${reciverId}`, socketData);
        yield session.commitTransaction();
        session.endSession();
        return newMessage[0];
    }
    catch (error) {
        yield session.abortTransaction();
        session.endSession();
        throw new Error(error);
    }
});
const getMessage = (userId, roomId) => __awaiter(void 0, void 0, void 0, function* () {
    const rooms = yield room_model_1.default.find({
        users: { $in: [userId] },
        _id: roomId,
    });
    if (!rooms) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Chat room not found.");
    }
    const chatdata = yield message_model_1.default.find({ roomId });
    return chatdata;
});
exports.MessageService = {
    sendMessage,
    getMessage,
};
