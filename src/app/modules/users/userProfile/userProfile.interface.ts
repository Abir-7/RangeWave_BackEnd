import { Types } from "mongoose";

export interface IUserLocation {
  apartmentNo: string;
  roadNo: string;
  state: string;
  city: string;
  zipCode: string;
  address: string;
  country: string;
}

export interface ICarInfo {
  carName: string;
  carModel: string;
  vinCode: string;
  licensePlate: string;
  tagNumber: string;
}

export interface IUserProfile {
  fullName: string;
  nickname?: string;
  dateOfBirth?: Date;
  email: string;
  phone?: string;
  location?: IUserLocation;
  image?: string;
  user: Types.ObjectId;
  carInfo: ICarInfo;
}
