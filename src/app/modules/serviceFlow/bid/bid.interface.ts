import { Types } from "mongoose";

export interface IBid {
  price: number;
  reqServiceId: Types.ObjectId;
  mechanicId: Types.ObjectId;
  status: BidStatus;
  extraWork: Types.ObjectId;
  location: {
    placeId: string;
    coordinates: {
      type: "Point";
      coordinates: number[];
    };
  };
}

export enum BidStatus {
  provided = "provided",
  declined = "declined",
}
