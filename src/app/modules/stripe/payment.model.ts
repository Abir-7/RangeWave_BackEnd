import { Schema, model, Model } from "mongoose";
import { IPayment, PaymentStatus, PaymentType } from "./payment.interface";

const paymentSchema = new Schema<IPayment>(
  {
    txId: {
      type: String,
      required: function () {
        return this.paymentType === PaymentType.ONLINE;
      },
      trim: true,
    },
    bidId: {
      type: Schema.Types.ObjectId,
      ref: "Bid",
      required: true,
    },
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    mechanicId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.UNPAID,
      required: true,
    },
    paymentType: {
      type: String,
      enum: Object.values(PaymentType),
      default: null,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    extraAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Payment: Model<IPayment> = model<IPayment>("Payment", paymentSchema);
export default Payment;
