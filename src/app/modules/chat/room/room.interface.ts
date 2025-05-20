import { Types } from "mongoose";

export interface IChatRoom {
  users: Types.ObjectId[];
  _id: string;
  lastMessage: Types.ObjectId;
}
