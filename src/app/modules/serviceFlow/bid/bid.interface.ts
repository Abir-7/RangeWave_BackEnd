import { Types } from "mongoose";

export interface IBid {
  price: number;
  reqServiceId: Types.ObjectId;
  mechanicId: Types.ObjectId;
  status: BidStatus;
}

export enum BidStatus {
  provided = "provided",
  declined = "declined",
}
