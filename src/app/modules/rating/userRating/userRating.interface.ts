import { Types } from "mongoose";
export interface IUserRating {
  rating: number;
  mechanicId: Types.ObjectId;
  user: Types.ObjectId;
}
