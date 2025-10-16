"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const messageSchema = new mongoose_1.Schema({
    roomId: { type: mongoose_1.Schema.Types.ObjectId, required: true, ref: "ChatRoom" },
    message: { type: String, required: true },
    sender: { type: mongoose_1.Schema.Types.ObjectId, required: true, ref: "User" },
}, {
    timestamps: true, // optional but recommended for createdAt/updatedAt
});
const Message = (0, mongoose_1.model)("Message", messageSchema);
exports.default = Message;
