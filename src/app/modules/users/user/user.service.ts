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
import mongoose from "mongoose";

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

const getProfileData = async (userId: string) => {
  const result = await User.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(userId) } },

    // Lookup AdminProfile
    {
      $lookup: {
        from: "adminprofiles", // MongoDB collection name (usually lowercase + plural)
        localField: "_id",
        foreignField: "user",
        as: "adminProfile",
      },
    },

    // Lookup UserProfile
    {
      $lookup: {
        from: "userprofiles",
        localField: "_id",
        foreignField: "user",
        as: "userProfile",
      },
    },
    // Lookup MechanicProfile
    {
      $lookup: {
        from: "mechanicprofiles",
        localField: "_id",
        foreignField: "user",
        as: "mechanicProfile",
      },
    },
    // Add a field 'profile' that picks adminProfile if role === 'admin', else userProfile
    {
      $addFields: {
        profile: {
          $switch: {
            branches: [
              {
                case: { $eq: ["$role", "ADMIN"] },
                then: { $arrayElemAt: ["$adminProfile", 0] },
              },
              {
                case: { $eq: ["$role", "MECHANIC"] },
                then: { $arrayElemAt: ["$mechanicProfile", 0] },
              },
              {
                case: { $eq: ["$role", "USER"] },
                then: { $arrayElemAt: ["$userProfile", 0] },
              },
            ],
            default: null,
          },
        },
      },
    },

    // Optionally remove adminProfile and userProfile arrays if you want cleaner output
    {
      $project: {
        adminProfile: 0,
        userProfile: 0,
        password: 0, // also hide password hash
        mechanicProfile: 0,
      },
    },
  ]);

  // result is an array with one element or empty if not found
  return result[0] || null;
};

export const UserService = {
  updateProfileImage,
  getProfileData,
};
