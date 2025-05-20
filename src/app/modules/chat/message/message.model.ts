import { Schema, model, Types, Document } from "mongoose";

export interface IMessage extends Document {
  roomId: Types.ObjectId;
  message: string;
  sender: Types.ObjectId;
}

const messageSchema = new Schema<IMessage>(
  {
    roomId: { type: Schema.Types.ObjectId, required: true, ref: "ChatRoom" },
    message: { type: String, required: true },
    sender: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  },
  {
    timestamps: true, // optional but recommended for createdAt/updatedAt
  }
);

const Message = model<IMessage>("Message", messageSchema);

export default Message;
