import { Types } from "mongoose";
export interface IUserRating {
  rating: number;
  text: string;
  mechanicId: Types.ObjectId;
  user: Types.ObjectId;
  serviceId: Types.ObjectId;
}
