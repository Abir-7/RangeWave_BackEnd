import { IUserProfile } from "./../userProfile/userProfile.interface";
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
import { IAdminProfile } from "../adminProfile/adminProfile.interface";
import { removeFalsyFields } from "../../../utils/helper/removeFalsyField";

const createUser = async (data: {
  email: string;
  fullName: string;
  password: string;
}): Promise<Partial<IUser>> => {
  const hashedPassword = await getHashedPassword(data.password);
  const otp = getOtp(4);
  const expDate = getExpiryTime(10);

  //user data
  const userData = {
    email: data.email,
    password: hashedPassword,
    authentication: { otp, expDate },
  };
  const createdUser = await User.create(userData);

  //user profile data
  const userProfileData = {
    fullName: data.fullName,
    email: createdUser.email,
    user: createdUser._id,
  };
  await UserProfile.create(userProfileData);
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

  let updated;

  if (user?.role === "USER") {
    updated = await UserProfile.findOneAndUpdate(
      { email: email },
      { image },
      { new: true }
    );
  }

  if (user?.role === "ADMIN") {
    updated = await AdminProfile.findOneAndUpdate(
      { email: email },
      { image },
      { new: true }
    );
  }

  if (!updated) {
    throw new AppError(status.BAD_REQUEST, "Failed to update image.");
  }

  return updated;
};

const updateProfileData = async (
  userdata: Partial<IAdminProfile> | Partial<IUserProfile>,
  email: string
): Promise<IAdminProfile | IUserProfile | null> => {
  const data = removeFalsyFields(userdata);
  const user = await User.findOne({ email: email });
  let updated;

  if (user?.role === "ADMIN") {
    updated = await AdminProfile.findOneAndUpdate({ email: email }, data, {
      new: true,
    });
  }
  if (user?.role === "USER") {
    updated = await UserProfile.findOneAndUpdate({ email: email }, data, {
      new: true,
    });
  }
  if (!updated) {
    throw new AppError(status.BAD_REQUEST, "Failed to update user info.");
  }

  return updated;
};

export const UserService = {
  createUser,
  updateProfileImage,
  updateProfileData,
};
