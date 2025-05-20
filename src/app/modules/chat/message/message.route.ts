import { Router } from "express";
import { auth } from "../../../middleware/auth/auth";
import { MessageController } from "./message.controller";

const router = Router();
router.post(
  "/send-message",
  auth("USER", "MECHANIC"),
  MessageController.sendMessage
);
export const MessageRoute = router;
