import { Types } from "mongoose";
import { ILocation } from "../mechanicProfile/mechanicProfile.interface";

export interface IUserProfile {
  fullName: string;
  nickname?: string;
  dateOfBirth?: Date;
  email: string;
  phone?: string;
  location?: ILocation;
  image?: string;
  user: Types.ObjectId;
  carInfo: {
    carName: string;
    carModel: string;
    vinCode: string;
    licensePlate: string;
    tagNumber: string;
  };
}
