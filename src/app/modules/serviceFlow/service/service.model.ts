import mongoose, { Model, Schema } from "mongoose";
import {
  CancelReason,
  ExtraWorkStatus,
  IExtraWork,
  IService,
  Status,
} from "./service.interface";

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

//-----------------------------------------EXTRA WORK MODEL-------------------------------------------------------------//

const ExtraWorkSchema: Schema<IExtraWork> = new Schema(
  {
    issue: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    reqServiceId: {
      type: Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },

    status: {
      type: String,
      enum: Object.values(ExtraWorkStatus), // ensures status only uses enum values
      default: ExtraWorkStatus.WAITING,
      required: true,
    },
  },
  {
    timestamps: true, // optional: adds createdAt and updatedAt timestamps
  }
);

// Model creation
export const ExtraWork: Model<IExtraWork> = mongoose.model<IExtraWork>(
  "ExtraWork",
  ExtraWorkSchema
);
