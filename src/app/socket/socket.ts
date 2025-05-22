/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
// socket.ts
import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import logger from "../utils/logger";

interface User {
  userId: string; // some unique user identifier from your auth system
  socketId: string; // socket connection ID
  username?: string; // optional extra info
}

const connectedUsers = new Map<string, User>();

let io: SocketIOServer | null = null;

export const initSocket = async (httpServer: HttpServer) => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*", // Customize this for security in prod
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    logger.info(`New client connected: ${socket.id}`);

    socket.on("register", (userData: { userId: string; username?: string }) => {
      if (connectedUsers.has(userData.userId)) {
        // User is already connected, update their socketId to new one
        const existingUser = connectedUsers.get(userData.userId)!;
        logger.info(
          `User ${userData.userId} already connected. Updating socket from ${existingUser.socketId} to ${socket.id}`
        );

        // Optionally, you can disconnect the old socket
        // const oldSocket = io?.sockets.sockets.get(existingUser.socketId);
        // if (oldSocket) oldSocket.disconnect();

        // Update to new socketId
        connectedUsers.set(userData.userId, {
          userId: userData.userId,
          socketId: socket.id,
          username: userData.username,
        });
      } else {
        // New user, add to map
        connectedUsers.set(userData.userId, {
          userId: userData.userId,
          socketId: socket.id,
          username: userData.username,
        });
        logger.info(
          `User registered: ${userData.userId} with socket ${socket.id}`
        );
      }
    });

    socket.on("disconnect", () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });

    // Add more socket event handlers here
  });

  return io;
};

export const getSocket = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};
