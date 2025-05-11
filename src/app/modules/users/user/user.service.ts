/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import status from "http-status";
import AppError from "../../../errors/AppError";
import { getRelativePath } from "../../../middleware/fileUpload/getRelativeFilePath";
import getExpiryTime from "../../../utils/helper/getExpiryTime";
import getHashedPassword from "../../../utils/helper/getHashedPassword";
import getOtp from "../../../utils/helper/getOtp";
import { sendEmail } from "../../../utils/sendEmail";
import { UserProfile } from "../userProfile/userProfile.model";

import { IUser } from "./user.interface";
import User from "./user.model";
import { AdminProfile } from "../adminProfile/adminProfile.model";

import { TUserRole } from "../../../interface/auth.interface";
import { MechanicProfile } from "../mechanicProfile/mechanicProfile.model";
import unlinkFile from "../../../utils/unlinkFiles";

const createUser = async (
  data: {
    email: string;
    fullName: string;
    password: string;
  },
  role: TUserRole
): Promise<Partial<IUser>> => {
  if (!role) {
    throw new AppError(status.BAD_REQUEST, "User role in required.");
  }

  const hashedPassword = await getHashedPassword(data.password);
  const otp = getOtp(4);
  const expDate = getExpiryTime(10);

  //user data
  const userData = {
    email: data.email,
    password: hashedPassword,
    authentication: { otp, expDate },
  };
  const createdUser = await User.create({ ...userData, role });

  //user profile data
  const userProfileData = {
    fullName: data.fullName,
    email: createdUser.email,
    user: createdUser._id,
  };
  if (role === "USER") {
    await UserProfile.create(userProfileData);
  }
  if (role === "MECHANIC") {
    await MechanicProfile.create(userProfileData);
  }
  await sendEmail(
    data.email,
    "Email Verification Code",
    `Your code is: ${otp}`
  );
  return { email: createdUser.email, isVerified: createdUser.isVerified };
};

const updateProfileImage = async (path: string, email: string) => {
  const image = getRelativePath(path);

  const user = await User.findOne({ email: email });

  let profile;

  if (user?.role === "USER") {
    profile = await UserProfile.findOne({ user: user._id });
    if (profile?.image) {
      unlinkFile(profile.image as string);
    }

    if (profile) {
      profile.image = image;
    }
  }

  if (user?.role === "ADMIN") {
    profile = await AdminProfile.findOne({ user: user._id });
    if (profile?.image) {
      unlinkFile(profile.image as string);
    }

    if (profile) {
      profile.image = image;
    }
  }

  if (user?.role === "MECHANIC") {
    profile = await MechanicProfile.findOne({ user: user._id });

    if (profile?.image) {
      unlinkFile(profile.image as string);
    }

    if (profile) {
      profile.image = image;
    }
  }

  await profile?.save();

  if (!profile) {
    unlinkFile(image as string);
    throw new AppError(status.BAD_REQUEST, "Failed to update image.");
  }

  return profile;
};

export const UserService = {
  createUser,
  updateProfileImage,
};
