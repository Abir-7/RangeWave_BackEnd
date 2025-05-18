import { Types } from "mongoose";

export interface IPayment {
  txId: string;
  bidId: Types.ObjectId;
  status: PaymentStatus;
}

export enum PaymentStatus {
  HOLD = "HOLD",
  CANCELLED = "CANCELLED", // or "CANCELED"
  PAID = "PAID",
  UNPAID = "UNPAID",
  REFUNDED = "REFUNDED",
}
