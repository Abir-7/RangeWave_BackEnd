import { Schema, model } from "mongoose";
import { IUserProfile } from "./userProfile.interface";

const userProfileSchema = new Schema<IUserProfile>({
  fullName: { type: String },
  nickname: { type: String },
  dateOfBirth: { type: Date },
  email: { type: String, unique: true },
  phone: { type: String },
  location: {
    apartmentNo: {
      type: String,
    },
    roadNo: {
      type: String,
    },
    state: {
      type: String,
    },
    city: {
      type: String,
    },
    zipCode: {
      type: String,
    },
    address: {
      type: String,
    },
    coordinates: {
      type: [Number],
      default: [],
      validate: {
        validator: function (v: [number, number]) {
          return v.length === 2 && !isNaN(v[0]) && !isNaN(v[1]);
        },
        message:
          "Coordinates should be an array of two numbers [longitude, latitude]",
      },
    },
  },
  image: { type: String },
  user: { type: Schema.Types.ObjectId, ref: "User", unique: true },
});

export const UserProfile = model<IUserProfile>(
  "UserProfile",
  userProfileSchema
);
