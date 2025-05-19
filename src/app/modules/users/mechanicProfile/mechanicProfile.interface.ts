import { Types } from "mongoose";

export interface IWorkingHour {
  start: string; // e.g., "10:00"
  end: string; // e.g., "15:00"
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
  country: string;
}

export interface IMechanicProfile {
  fullName: string;
  email: string;
  location: ILocation;
  phoneNumber: string;
  image: string;
  user: Types.ObjectId;
  stripeAccountId: string;
  workshop: IWorkshop;
  experience: string[];
  certificates: ICertificate[];
}

export interface IWorkshop {
  name: string;
  workingHours: IWorkingHour;
  services: string[];
  location: {
    name: string;
    placeId: string;
    coordinates: {
      type: "Point";
      coordinates: number[];
    }; // [longitude, latitude]
  };
}
