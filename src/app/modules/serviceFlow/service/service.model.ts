import mongoose, { Schema } from "mongoose";
import { CancelReason, IService, Status } from "./service.interface";

const serviceSchema = new Schema<IService>(
  {
    issue: { type: String, required: true },
    description: { type: String, required: true },
    extraWork: {
      type: Schema.Types.ObjectId,
      ref: "ExtraWork",
      default: null,
    },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: [...Object.values(Status)],
      default: Status.FINDING,
    },
    isStatusAccepted: {
      type: Boolean,
      default: null,
    },
    cancelReson: {
      type: String,

      enum: Object.values(CancelReason),
      required: function () {
        return this.status === Status.CANCELLED; // Only required if status is 'cancel'
      },
    },
    location: {
      placeId: {
        type: String,
      },
      coordinates: {
        type: { type: String, enum: ["Point"] }, // 'Point' is the type
        coordinates: {
          type: [Number], // Array of numbers (longitude, latitude)
        },
      },
    },

    schedule: {
      isSchedule: {
        type: Boolean,
        required: true,
        default: false,
      },
      date: {
        type: Date,
        required: false,
        default: null,
      },
    },
  },
  { timestamps: true }
);

serviceSchema.index({ status: 1 });

export const Service = mongoose.model<IService>("Service", serviceSchema);
