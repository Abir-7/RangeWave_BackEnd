/* eslint-disable arrow-body-style */
import status from "http-status";
import AppError from "../../../errors/AppError";
import { IUserProfile } from "./userProfile.interface";
import { UserProfile } from "./userProfile.model";
import { removeFalsyFields } from "../../../utils/helper/removeFalsyField";
import { ILocation } from "../mechanicProfile/mechanicProfile.interface";
import User from "../user/user.model";
import mongoose from "mongoose";

const updateUserProfile = async (
  email: string,
  data: Partial<IUserProfile>
): Promise<IUserProfile> => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Fetch the profile data within the transaction
    const profileData = await UserProfile.findOne({ email }).session(session);

    if (!profileData) {
      throw new AppError(status.NOT_FOUND, "User profile not found.");
    }

    const { fullName, carInfo, dateOfBirth, location, phone } = data;

    // Update the profile data if the fields are provided
    if (fullName) {
      profileData.fullName = fullName;
    }
    if (dateOfBirth) {
      profileData.dateOfBirth = dateOfBirth;
    }
    if (phone) {
      profileData.phone = phone;
    }

    // Update carInfo if provided
    if (carInfo && Object.keys(carInfo).length > 0) {
      if (!profileData.carInfo) {
        profileData.carInfo = {
          carName: "",
          carModel: "",
          vinCode: "",
          licensePlate: "",
          tagNumber: "",
        };
      }
      const newCarInfo = removeFalsyFields(
        carInfo as unknown as Record<string, unknown>
      );
      for (const key in newCarInfo) {
        const value = newCarInfo[key as keyof typeof newCarInfo];
        if (value && typeof value === "string") {
          profileData.carInfo[key as keyof typeof profileData.carInfo] = value;
        }
      }
    }

    // Update location if provided
    if (location && Object.keys(location).length > 0) {
      const { ...other } = location;
      const locations = removeFalsyFields(other) as Partial<ILocation>;
      if (profileData.location) {
        for (const field in locations) {
          profileData.location[field as keyof ILocation] = (
            locations as Record<string, string>
          )[field];
        }
      }
    }

    // Save the updated profile data within the transaction
    await profileData.save({ session });

    // Update the `needToUpdateProfile` field in the User model
    await User.findByIdAndUpdate(profileData.user, {
      needToUpdateProfile: false,
    }).session(session);

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    return profileData;
  } catch (error) {
    // If any error occurs, abort the transaction
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const UserProfileService = { updateUserProfile };
