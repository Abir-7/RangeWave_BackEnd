import { Types } from "mongoose";

export interface IMechanicRating {
  rating: number;
  text: string;
  mechanicId: Types.ObjectId;
  user: Types.ObjectId;
  serviceId: Types.ObjectId;
}
