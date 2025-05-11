import { Types } from "mongoose";

export interface IWorkingHour {
  start: string; // e.g., "10:00"
  end: string; // e.g., "15:00"
}

export interface IExperience {
  workshopName: string;
  years: number;
}

export interface ICertificate {
  institutionName: string;
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
}

export interface ILocation {
  apartmentNo: string;
  roadNo: string;
  state: string;
  city: string;
  zipCode: string;
  address: string;
  coordinates: number[]; // [longitude, latitude]
}

export interface IMechanicProfile {
  fullName: string;
  email: string;
  workshopName: string;
  location: ILocation;
  phoneNumber: string;
  workingHours: IWorkingHour;
  services: string[];
  experience: IExperience[];
  certificates: ICertificate[];
  image: string;
  user: Types.ObjectId;
}
