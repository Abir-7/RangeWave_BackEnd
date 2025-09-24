// models/car.model.ts
import mongoose, { Schema } from "mongoose";

export interface ICar {
  model: string;
}

const CarSchema = new Schema<ICar>(
  {
    model: { type: String, required: true, unique: true, trim: true },
  },
  { timestamps: true }
);

export const Car = mongoose.model<ICar>("Car", CarSchema);
