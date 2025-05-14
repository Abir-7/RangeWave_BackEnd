/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable arrow-body-style */
import status from "http-status";
import AppError from "../../../errors/AppError";
import {
  ILocation,
  IMechanicProfile,
  IWorkingHour,
} from "./mechanicProfile.interface";
import { MechanicProfile } from "./mechanicProfile.model";
import { removeFalsyFields } from "../../../utils/helper/removeFalsyField";
import User from "../user/user.model";
import { startSession } from "mongoose";

const updateMechanicProfile = async (
  email: string,
  data: Partial<IMechanicProfile>
): Promise<IMechanicProfile> => {
  const session = await startSession(); // Start a session for the transaction
  session.startTransaction();

  try {
    const mechanicProfile = await MechanicProfile.findOne({
      email: email,
    }).session(session);

    if (!mechanicProfile) {
      throw new AppError(status.NOT_FOUND, "Mechanic profile not found");
    }

    const {
      certificates,
      experience,
      location,
      phoneNumber,
      workshopName,
      workingHours,
      fullName,
      services,
    } = data;

    if (location && Object.keys(location).length > 0) {
      const { coordinates, ...other } = location;
      const locations = removeFalsyFields(other) as Partial<ILocation>;
      for (const field in locations) {
        mechanicProfile.location[
          field as keyof Omit<ILocation, "coordinates">
        ] = (locations as Record<string, string>)[field];
      }

      if (coordinates?.coordinates.length === 2) {
        mechanicProfile.location.coordinates.coordinates =
          coordinates.coordinates;
      }
    }

    if (certificates && certificates?.length > 0) {
      mechanicProfile.certificates = certificates;
    }

    if (experience && experience.length > 0) {
      mechanicProfile.experience = experience;
    }

    if (services && services.length > 0) {
      mechanicProfile.services = services;
    }

    if (phoneNumber) {
      mechanicProfile.phoneNumber = phoneNumber;
    }

    if (workshopName) {
      mechanicProfile.workshopName = workshopName;
    }

    if (fullName) {
      mechanicProfile.fullName = fullName;
    }

    if (workingHours && Object.keys(workingHours).length > 0) {
      const newData = removeFalsyFields(workingHours as any);
      for (const field in newData) {
        mechanicProfile.workingHours[field as keyof IWorkingHour] =
          newData[field];
      }
    }

    await User.findByIdAndUpdate(
      mechanicProfile.user,
      {
        needToUpdateProfile: false,
      },
      { new: true, session }
    );

    await mechanicProfile.save({ session });

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    return mechanicProfile;
  } catch (error) {
    // If any error occurs, roll back the transaction
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const MechanicProfileService = { updateMechanicProfile };
