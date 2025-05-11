import {
  ICertificate,
  IExperience,
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

// Experience Schema
const ExperienceSchema = new Schema<IExperience>(
  {
    workshopName: {
      type: String,
    },
    years: {
      type: Number,
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
const MechanicProfileSchema = new Schema<IMechanicProfile>({
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
    type: [ExperienceSchema],
    default: [], // array of experiences
  },
  certificates: {
    type: [CertificateSchema],
    default: [], // array of certificates
  },
});

// Create and export the model
export const MechanicProfile = model("MechanicProfile", MechanicProfileSchema);
