import { Schema, model } from "mongoose";
import { IMechanicRating } from "./mechanicRating.interface";

// Define the mechanic rating schema
const mechanicRatingSchema = new Schema<IMechanicRating>(
  {
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    mechanicId: {
      type: Schema.Types.ObjectId,
      ref: "User",
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
  },
  { timestamps: true }
);

// Create the model from the schema
const MechanicRating = model<IMechanicRating>(
  "MechanicRating",
  mechanicRatingSchema
);

export default MechanicRating;
