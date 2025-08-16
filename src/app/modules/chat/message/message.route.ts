import { Router } from "express";
import { auth } from "../../../middleware/auth/auth";
import { MessageController } from "./message.controller";

const router = Router();
router.post(
  "/send-message",
  auth("USER", "MECHANIC"),
  MessageController.sendMessage
);

router.get(
  "/get-message/:roomId",
  auth("USER", "MECHANIC"),

  MessageController.getMessage
);
export const MessageRoute = router;
