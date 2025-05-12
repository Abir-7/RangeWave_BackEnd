import mongoose, { Schema } from "mongoose";
import { CancelReason, IService, Status } from "./service.interface";

const serviceSchema = new Schema<IService>(
  {
    issue: { type: String, required: true },
    description: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: [...Object.values(Status)],
      default: Status.FINDING,
    },
    cancelReson: {
      type: String,

      enum: Object.values(CancelReason),
      required: function () {
        return this.status === Status.CANCELLED; // Only required if status is 'cancel'
      },
    },
  },
  { timestamps: true }
);

// Create the model
const Service = mongoose.model<IService>("Service", serviceSchema);

export default Service;
