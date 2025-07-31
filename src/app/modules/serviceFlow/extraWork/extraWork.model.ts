import mongoose, { Model, Schema } from "mongoose";
import { ExtraWorkStatus, IExtraWork } from "./extraWork.interface";

const ExtraWorkSchema: Schema<IExtraWork> = new Schema(
  {
    issue: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    bidId: {
      type: Schema.Types.ObjectId,
      ref: "Bid",
      required: true,
    },
    reqServiceId: {
      type: Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },
    mechanicId: { type: Schema.Types.ObjectId, required: true },
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
