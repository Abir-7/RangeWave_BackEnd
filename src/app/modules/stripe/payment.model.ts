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
      unique: true,
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
      unique: true,
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
        default: PaymentStatus.UNPAID,
        required: true,
      },
      txId: { type: Schema.Types.ObjectId, default: null },
    },
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
