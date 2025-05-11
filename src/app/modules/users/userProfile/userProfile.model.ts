import { Schema, model } from "mongoose";
import { IUserProfile } from "./userProfile.interface";

const carInfoSchema = new Schema(
  {
    carName: {
      type: String,
      required: true,
    },
    carModel: {
      type: String,
      required: true,
    },
    vinCode: {
      type: String,
      required: true,
    },
    licensePlate: {
      type: String,
      required: true,
    },
    tagNumber: {
      type: String,
      required: true,
    },
  },
  {
    _id: false, // No separate _id for this sub-document
  }
);

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
  carInfo: carInfoSchema,
});

export const UserProfile = model<IUserProfile>(
  "UserProfile",
  userProfileSchema
);
