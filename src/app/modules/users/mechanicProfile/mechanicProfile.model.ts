import { model, Schema } from "mongoose";
import {
  ICertificate,
  ILocation,
  IMechanicProfile,
  IWorkingHour,
} from "./mechanicProfile.interface";

const WorkingHourSchema = new Schema<IWorkingHour>({
  start: { type: String, required: true },
  end: { type: String, required: true },
});

const CertificateSchema = new Schema<ICertificate>({
  institutionName: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
});

const LocationSchema = new Schema<ILocation>({
  apartmentNo: { type: String, required: true },
  roadNo: { type: String, required: true },
  state: { type: String, required: true },
  city: { type: String, required: true },
  zipCode: { type: String, required: true },
  address: { type: String, required: true },
  country: { type: String, required: true },
});

const MechanicProfileSchema = new Schema<IMechanicProfile>(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    location: { type: LocationSchema, required: true },
    phoneNumber: { type: String, required: true },
    image: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    stripeAccountId: { type: String, required: true },
    workshop: {
      name: { type: String, required: true },
      workingHours: { type: WorkingHourSchema, required: true },
      services: [{ type: String }],
      location: {
        name: { type: String, required: true },
        placeId: { type: String, required: true },
        coordinates: {
          type: {
            type: String,
            enum: ["Point"],
            required: true,
          },
          coordinates: {
            type: [Number],
            required: true,
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
