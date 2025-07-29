import { model, Schema } from "mongoose";
import { ICarInfo, IUserLocation, IUserProfile } from "./userProfile.interface";

const LocationSchema = new Schema<IUserLocation>(
  {
    apartmentNo: { type: String },
    roadNo: { type: String },
    state: { type: String },
    city: { type: String },
    zipCode: { type: String },
    address: { type: String },
    country: { type: String },
  },
  { _id: false }
);

const CarInfoSchema = new Schema<ICarInfo>(
  {
    carName: { type: String },
    carModel: { type: String },
    vinCode: { type: String },
    licensePlate: { type: String },
    tagNumber: { type: String },
  },
  { _id: false }
);

const userProfileSchema = new Schema<IUserProfile>(
  {
    fullName: { type: String },
    nickname: { type: String },
    dateOfBirth: { type: Date },
    email: { type: String, unique: true },
    phone: { type: String },
    location: { type: LocationSchema, default: {} },
    image: { type: String },
    stripeCustomerId: { type: String },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    carInfo: { type: CarInfoSchema, default: {} },
  },
  { timestamps: true }
);

export const UserProfile = model<IUserProfile>(
  "UserProfile",
  userProfileSchema
);
