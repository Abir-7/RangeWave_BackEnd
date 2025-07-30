import mongoose, { Model, Schema } from "mongoose";
import { IPayment, PaymentStatus } from "./payment.interface";

const paymentSchema: Schema<IPayment> = new Schema(
  {
    txId: { type: String, unique: true, sparse: true },
    transferId: { type: String, unique: true, sparse: true },
    bidId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bid",
      required: true,
    },
    user: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.UNPAID,
      required: true,
    },
    extraPay: {
      work: {
        type: Schema.Types.ObjectId,
        ref: "ExtraWork",
        default: null,
      },
      status: {
        type: String,
        enum: Object.values(PaymentStatus),
        default: null,
      },
      txId: { type: Schema.Types.ObjectId, default: null },
    },
    isPaymentTransfered: { type: Boolean, default: false },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

const Payment: Model<IPayment> = mongoose.model<IPayment>(
  "Payment",
  paymentSchema
);

export default Payment;
