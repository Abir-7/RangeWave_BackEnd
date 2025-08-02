import { Types } from "mongoose";

export interface IPayment {
  txId: string;
  bidId: Types.ObjectId;
  serviceId: Types.ObjectId;
  user: Types.ObjectId;
  mechanicId: Types.ObjectId;
  status: PaymentStatus;
  paymentType: PaymentType;
  amount: number;
  extraAmount: number;
}

export enum PaymentType {
  ONLINE = "ONLINE",
  OFFLINE = "OFFLINE",
}

export enum PaymentStatus {
  CANCELLED = "CANCELLED",
  PAID = "PAID",
  UNPAID = "UNPAID",
  REFUNDED = "REFUNDED",
}
