import { model, Schema } from "mongoose";
import {
  ICertificate,
  ILocation,
  IMechanicProfile,
  IWorkingHour,
} from "./mechanicProfile.interface";

const WorkingHourSchema = new Schema<IWorkingHour>({
  start: { type: String },
  end: { type: String },
});

const CertificateSchema = new Schema<ICertificate>({
  institutionName: { type: String },
  startTime: { type: String },
  endTime: { type: String },
});

const LocationSchema = new Schema<ILocation>({
  apartmentNo: { type: String },
  roadNo: { type: String },
  state: { type: String },
  city: { type: String },
  zipCode: { type: String },
  address: { type: String },
  country: { type: String },
});

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
    experience: [{ type: String }],
    certificates: [CertificateSchema],
  },
  {
    timestamps: true,
  }
);

// Add a 2dsphere index to the coordinates field
MechanicProfileSchema.index({ "location.coordinates": "2dsphere" });

// Create and export the model
export const MechanicProfile = model("MechanicProfile", MechanicProfileSchema);
