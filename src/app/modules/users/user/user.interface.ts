import { Document } from "mongoose";
import { TUserRole } from "../../../interface/auth.interface";

export interface IBaseUser {
  email: string;
  role: TUserRole;
  password: string;
  authentication: {
    expDate: Date;
    otp: string;
    token: string;
  };
  isVerified: boolean;
  needToResetPass: boolean;
  needToUpdateProfile: boolean;
  isBlocked: boolean;
  isDeleted: boolean;
}

export interface IUser extends IBaseUser, Document {
  comparePassword(enteredPassword: string): Promise<boolean>;
}
