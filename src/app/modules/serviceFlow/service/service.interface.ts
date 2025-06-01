import { Types } from "mongoose";

export interface IService {
  issue: string;
  description: string;
  user: Types.ObjectId;
  status: Status;
  isStatusAccepted: boolean;
  location: {
    placeId: string;
    coordinates: {
      type: "Point";
      coordinates: number[];
    }; // [longitude, latitude]
  };

  extraWork: Types.ObjectId; //! todo make function for extrapay

  cancelReson: CancelReason;
}

export enum Status {
  FINDING = "FINDING", // when
  WORKING = "WORKING", //when client click start button
  UNPAID = "UNPAID", // when click on hire button
  WAITING = "WAITING", //after done payment
  CANCELLED = "CANCELLED", // when user or mechanic click cencel
  COMPLETED = "COMPLETED", // after completed service
}

export enum CancelReason {
  WAIT_TIME_TOO_LONG = "Wait time is too long",
  COULD_NOT_FIND_MECHANIC = "Could not find mechanic",
  MECHANIC_NOT_GETTING_CLOSER = "Mechanic not getting closer",
  MECHANIC_ASKED_ME_TO_CANCEL = "Mechanic asked me to cancel",
  OTHER = "Other",
}

// For ExtraWorkModel

export interface IExtraWork {
  issue: string;
  description: string;
  price: number;
  reqServiceId: Types.ObjectId;
  status: ExtraWorkStatus;
}
export enum ExtraWorkStatus {
  WAITING = "WAITING",
  REJECTED = "REJECTED",
  ACCEPTED = "ACCEPTED",
}
