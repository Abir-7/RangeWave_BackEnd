import { Types } from "mongoose";

export interface IMechanicRating {
  rating: number;
  mechanicId: Types.ObjectId;
  user: Types.ObjectId;
}
