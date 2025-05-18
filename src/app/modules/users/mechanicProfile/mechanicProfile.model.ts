import {
  ICertificate,
  IMechanicProfile,
  IWorkingHour,
} from "./mechanicProfile.interface";
import { model, Schema } from "mongoose";

const WorkingHourSchema = new Schema<IWorkingHour>(
  {
    start: {
      type: String,
    },
    end: {
      type: String,
    },
  },
  {
    _id: false,
  }
);

// Certificate Schema
const CertificateSchema = new Schema<ICertificate>(
  {
    institutionName: {
      type: String,
    },
    startTime: {
      type: String,
    },
    endTime: {
      type: String,
    },
  },
  {
    _id: false,
  }
);

// MechanicProfile Schema
// MechanicProfile Schema
const MechanicProfileSchema = new Schema<IMechanicProfile>(
  {
    fullName: {
      type: String,
    },
    email: {
      type: String,
    },
    workshopName: {
      type: String,
    },
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
        type: { type: String, enum: ["Point"] }, // 'Point' is the type
        coordinates: {
          type: [Number], // Array of numbers (longitude, latitude)
        },
      },
    },
    phoneNumber: {
      type: String,
    },
    workingHours: {
      type: WorkingHourSchema,
    },
    services: {
      type: [String],
      default: [], // array of strings
    },
    experience: {
      type: [String],
      default: [], // array of experiences
    },
    certificates: {
      type: [CertificateSchema],
      default: [], // array of certificates
    },
    image: { type: String },
    user: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    stripeAccountId: { type: String },
  },
  { timestamps: true }
);

// Add a 2dsphere index to the coordinates field
MechanicProfileSchema.index({ "location.coordinates": "2dsphere" });

// Create and export the model
export const MechanicProfile = model("MechanicProfile", MechanicProfileSchema);
