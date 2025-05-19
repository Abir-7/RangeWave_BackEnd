import { Types } from "mongoose";

export interface IService {
  issue: string;
  description: string;
  user: Types.ObjectId;
  status: Status;
  location: {
    placeId: string;
    coordinates: {
      type: "Point";
      coordinates: number[];
    }; // [longitude, latitude]
  };
  cancelReson: CancelReason;
}

export enum Status {
  FINDING = "finding",
  WORKING = "working",
  UNPAID = "unpaid",
  WAITING = "waiting",
  CANCELLED = "Cancelled",
  COMPLETED = "COMPLETED",
}
export enum CancelReason {
  WAIT_TIME_TOO_LONG = "Wait time is too long",
  COULD_NOT_FIND_MECHANIC = "Could not find mechanic",
  MECHANIC_NOT_GETTING_CLOSER = "Mechanic not getting closer",
  MECHANIC_ASKED_ME_TO_CANCEL = "Mechanic asked me to cancel",
  OTHER = "Other",
}
