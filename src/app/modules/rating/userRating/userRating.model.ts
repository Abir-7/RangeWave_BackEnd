import { Schema, model } from "mongoose";

import { IUserRating } from "./userRating.interface";

// Define the user rating schema
const userRatingSchema = new Schema<IUserRating>(
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
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Create the model from the schema
const UserRating = model<IUserRating>("UserRating", userRatingSchema);

export default UserRating;
