import mongoose, { Schema, Document, Model } from "mongoose";

export interface IChatRoom extends Document {
  users: [string, string]; // Exactly two user IDs
}

const ChatRoomSchema: Schema<IChatRoom> = new Schema(
  {
    users: {
      type: [String],
      required: true,
      validate: {
        validator: (arr: string[]) => arr.length === 2,
        message: "Users array must contain exactly two user IDs",
      },
    },
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
