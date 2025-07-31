import { Types } from "mongoose";

export interface IPayment {
  txId: string;
  bidId: Types.ObjectId;
  serviceId: Types.ObjectId;
  status: PaymentStatus;
  extraPay: {
    extraWorkId: Types.ObjectId;
    txId: string;
    status: PaymentStatus;
    isPaymentTransfered: boolean;
  }; //! todo make function for extrapay
  transferId: string;
  user: Types.ObjectId;
  isPaymentTransfered: boolean;
}

export enum PaymentStatus {
  HOLD = "HOLD",
  CANCELLED = "CANCELLED", // or "CANCELED"
  PAID = "PAID",
  UNPAID = "UNPAID",
  REFUNDED = "REFUNDED",
}
