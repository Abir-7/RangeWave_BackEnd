/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import status from "http-status";
import AppError from "../../../errors/AppError";
import { getRelativePath } from "../../../middleware/fileUpload/getRelativeFilePath";

import { UserProfile } from "../userProfile/userProfile.model";

import User from "./user.model";
import { AdminProfile } from "../adminProfile/adminProfile.model";

import { MechanicProfile } from "../mechanicProfile/mechanicProfile.model";
import unlinkFile from "../../../utils/unlinkFiles";

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
  updateProfileImage,
};
