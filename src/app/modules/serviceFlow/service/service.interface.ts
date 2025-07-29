import { Types } from "mongoose";

export interface IService {
  issue: string;
  description: string;
  user: Types.ObjectId;
  status: Status;
  isServiceCompleted: IsServiceCompleted;
  location: {
    placeId: string;
    coordinates: {
      type: "Point";
      coordinates: number[];
    }; // [longitude, latitude]
  };

  extraWork: Types.ObjectId;
  schedule: {
    isSchedule: boolean;
    date: Date;
  };
  cancelReson: CancelReason;
}

export enum Status {
  FINDING = "FINDING",
  WAITING = "WAITING",
  WORKING = "WORKING",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum IsServiceCompleted {
  YES = "YES",
  NO = "NO",
  WAITING = "WAITING",
  REJECTED = "REJECTED",
}

export enum CancelReason {
  WAIT_TIME_TOO_LONG = "Wait time is too long",
  COULD_NOT_FIND_MECHANIC = "Could not find mechanic",
  MECHANIC_NOT_GETTING_CLOSER = "Mechanic not getting closer",
  MECHANIC_ASKED_ME_TO_CANCEL = "Mechanic asked me to cancel",
  OTHER = "Other",
}

// For ExtraWorkModel
