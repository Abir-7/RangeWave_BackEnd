import mongoose, { Schema, Model } from "mongoose";
import { IChatRoom } from "./room.interface";

const ChatRoomSchema: Schema<IChatRoom> = new Schema(
  {
    users: {
      type: [Schema.Types.ObjectId],
      required: true,
      ref: "User",
      validate: {
        validator: (arr: string[]) => arr.length === 2,
        message: "Users array must contain exactly two user IDs",
      },
    },

    lastMessage: { type: Schema.Types.ObjectId, ref: "Message" },
  },
  {
    timestamps: true,
  }
);

const ChatRoom: Model<IChatRoom> = mongoose.model<IChatRoom>(
  "ChatRoom",
  ChatRoomSchema
);

export default ChatRoom;
