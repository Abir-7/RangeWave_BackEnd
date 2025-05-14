import { Schema, model } from "mongoose";
import { IUserProfile } from "./userProfile.interface";

const carInfoSchema = new Schema(
  {
    carName: {
      type: String,
    },
    carModel: {
      type: String,
    },
    vinCode: {
      type: String,
    },
    licensePlate: {
      type: String,
    },
    tagNumber: {
      type: String,
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
    country: { type: String },
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
      type: { type: String, enum: ["Point"], required: true }, // 'Point' is the type
      coordinates: {
        type: [Number], // Array of numbers (longitude, latitude)
        required: true,
      },
    },
    default: {},
  },
  image: { type: String },
  user: { type: Schema.Types.ObjectId, ref: "User", unique: true },
  carInfo: carInfoSchema,
});
userProfileSchema.index({ "location.coordinates": "2dsphere" });

export const UserProfile = model<IUserProfile>(
  "UserProfile",
  userProfileSchema
);
