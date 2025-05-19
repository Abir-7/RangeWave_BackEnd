import { model, Schema } from "mongoose";
import { ICarInfo, ILocation, IUserProfile } from "./userProfile.interface";

const LocationSchema = new Schema<ILocation>(
  {
    apartmentNo: { type: String, required: true },
    roadNo: { type: String, required: true },
    state: { type: String, required: true },
    city: { type: String, required: true },
    zipCode: { type: String, required: true },
    address: { type: String, required: true },
    country: { type: String, required: true },
  },
  { _id: false }
);

const CarInfoSchema = new Schema<ICarInfo>(
  {
    carName: { type: String, required: true },
    carModel: { type: String, required: true },
    vinCode: { type: String, required: true },
    licensePlate: { type: String, required: true },
    tagNumber: { type: String, required: true },
  },
  { _id: false }
);

const userProfileSchema = new Schema<IUserProfile>(
  {
    fullName: { type: String, required: true },
    nickname: { type: String },
    dateOfBirth: { type: Date },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    location: { type: LocationSchema },
    image: { type: String },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    carInfo: { type: CarInfoSchema, required: true },
  },
  { timestamps: true }
);

export const UserProfile = model<IUserProfile>(
  "UserProfile",
  userProfileSchema
);
