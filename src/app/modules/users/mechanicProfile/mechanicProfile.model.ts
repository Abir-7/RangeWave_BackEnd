import { model, Schema } from "mongoose";
import {
  ICertificate,
  ILocation,
  IMechanicProfile,
  IWorkingHour,
} from "./mechanicProfile.interface";

const WorkingHourSchema = new Schema<IWorkingHour>(
  {
    start: { type: String },
    end: { type: String },
  },
  { _id: false }
);

const CertificateSchema = new Schema<ICertificate>(
  {
    institutionName: { type: String },
    startTime: { type: String },
    endTime: { type: String },
  },
  { _id: false }
);

const LocationSchema = new Schema<ILocation>(
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

const MechanicProfileSchema = new Schema<IMechanicProfile>(
  {
    fullName: { type: String },
    email: { type: String },
    location: { type: LocationSchema, default: {} },
    phoneNumber: { type: String },
    image: { type: String },
    user: { type: Schema.Types.ObjectId, ref: "User" },
    stripeAccountId: { type: String },
    workshop: {
      _id: false,
      name: { type: String },
      workingHours: { type: WorkingHourSchema, default: {} },
      services: [{ type: String }],
      location: {
        name: { type: String },
        placeId: { type: String },
        coordinates: {
          type: {
            type: String,
            enum: ["Point"],
          },
          coordinates: {
            type: [Number],
          },
        },
      },
    },
    experience: [{ type: String, _id: false }],
    certificates: [CertificateSchema],
    isNeedToPayForWorkShop: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// Add a 2dsphere index to the coordinates field
MechanicProfileSchema.index({ "workshop.location.coordinates": "2dsphere" });

// Create and export the model
export const MechanicProfile = model("MechanicProfile", MechanicProfileSchema);
