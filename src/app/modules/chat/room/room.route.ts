import { Router } from "express";
import { auth } from "../../../middleware/auth/auth";
import { RoomController } from "./room.controller";

const router = Router();
router.get(
  "/get-chat-list",
  auth("USER", "MECHANIC"),
  RoomController.getChatList
);
export const ChatRoute = router;
