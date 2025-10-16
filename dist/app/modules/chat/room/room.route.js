"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatRoute = void 0;
const express_1 = require("express");
const auth_1 = require("../../../middleware/auth/auth");
const room_controller_1 = require("./room.controller");
const router = (0, express_1.Router)();
router.get("/get-chat-list", (0, auth_1.auth)("USER", "MECHANIC"), room_controller_1.RoomController.getChatList);
exports.ChatRoute = router;
