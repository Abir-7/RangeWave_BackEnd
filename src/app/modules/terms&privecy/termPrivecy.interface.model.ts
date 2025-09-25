// models/Policy.model.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPolicy extends Document {
  term: string;
  privacy: string;
  createdAt: Date;
  updatedAt: Date;
}

const PolicySchema: Schema<IPolicy> = new Schema(
  {
    term: { type: String, default: "" },
    privacy: { type: String, default: "" },
  },
  {
    timestamps: true, // adds createdAt & updatedAt
  }
);

export const Policy: Model<IPolicy> = mongoose.model<IPolicy>(
  "Policy",
  PolicySchema
);
