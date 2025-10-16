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
exports.getSocket = exports.initSocket = exports.io = void 0;
const socket_io_1 = require("socket.io");
const logger_1 = __importDefault(require("../utils/logger"));
const message_service_1 = require("../modules/chat/message/message.service");
const payment_model_1 = __importDefault(require("../modules/stripe/payment.model"));
const service_interface_1 = require("../modules/serviceFlow/service/service.interface");
const connectedUsers = new Map();
exports.io = null;
const initSocket = (httpServer) => __awaiter(void 0, void 0, void 0, function* () {
    exports.io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: "*", // Customize this for security in prod
            methods: ["GET", "POST"],
        },
    });
    exports.io.on("connection", (socket) => {
        logger_1.default.info(`New client connected: ${socket.id}`);
        socket.on("register", (userData) => {
            if (connectedUsers.has(userData.userId)) {
                // User is already connected, update their socketId to new one
                const existingUser = connectedUsers.get(userData.userId);
                logger_1.default.info(`User ${userData.userId} already connected. Updating socket from ${existingUser.socketId} to ${socket.id}`);
                // Update to new socketId
                connectedUsers.set(userData.userId, {
                    userId: userData.userId,
                    socketId: socket.id,
                    username: userData.username,
                });
            }
            else {
                // New user, add to map
                connectedUsers.set(userData.userId, {
                    userId: userData.userId,
                    socketId: socket.id,
                    username: userData.username,
                });
                logger_1.default.info(`User registered: ${userData.userId} with socket ${socket.id}`);
            }
        });
        socket.on("chat-room", (data) => __awaiter(void 0, void 0, void 0, function* () {
            yield message_service_1.MessageService.sendMessage(data.userId, {
                roomId: data.roomId,
                message: data.message,
            });
            exports.io === null || exports.io === void 0 ? void 0 : exports.io.emit(`room-${data.roomId}`, data);
        }));
        socket.on("live-location", (data) => __awaiter(void 0, void 0, void 0, function* () {
            logger_1.default.info(data);
            exports.io === null || exports.io === void 0 ? void 0 : exports.io.emit(`location-${data.paymentId}`, data.coordinates);
        }));
        socket.on("working-status", (data) => __awaiter(void 0, void 0, void 0, function* () {
            const statusMessages = {
                [service_interface_1.Status.FINDING]: "Service is being searched...",
                [service_interface_1.Status.WAITING]: "Service is waiting for approval...",
                [service_interface_1.Status.WORKING]: "Service is in progress...",
                [service_interface_1.Status.COMPLETED]: "Service has been completed.",
                [service_interface_1.Status.CANCELLED]: "Service was cancelled.",
            };
            const paymentData = yield payment_model_1.default.findById(data.paymentId);
            if (!paymentData)
                return;
            const socketData = Object.assign(Object.assign({}, data), { message: statusMessages[data.status] ||
                    `Service status changed to ${data.status}` });
            exports.io === null || exports.io === void 0 ? void 0 : exports.io.emit(`user-${paymentData.user}`, socketData);
        }));
        socket.on("disconnect", () => {
            logger_1.default.info(`Client disconnected: ${socket.id}`);
        });
    });
    return exports.io;
});
exports.initSocket = initSocket;
const getSocket = () => {
    if (!exports.io) {
        throw new Error("Socket.io not initialized!");
    }
    return exports.io;
};
exports.getSocket = getSocket;
