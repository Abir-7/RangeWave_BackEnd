import mongoose, { Model, Schema } from "mongoose";
import { IPayment, PaymentStatus } from "./payment.interface";

const paymentSchema: Schema<IPayment> = new Schema(
  {
    txId: { type: String, required: true, unique: true },
    bidId: { type: mongoose.Schema.Types.ObjectId, ref: "Bid", required: true },
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.HOLD,
      required: true,
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
