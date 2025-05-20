import { Types } from "mongoose";

export interface IMessage {
  roomId: Types.ObjectId;
  message: string;
  sender: Types.ObjectId;
}
