import { Types } from "mongoose";

export interface IExtraWork {
  issue: string;
  description: string;
  price: number;
  bidId: Types.ObjectId;
  reqServiceId: Types.ObjectId;
  status: ExtraWorkStatus;
}

export enum ExtraWorkStatus {
  WAITING = "WAITING",
  REJECTED = "REJECTED",
  ACCEPTED = "ACCEPTED",
}
