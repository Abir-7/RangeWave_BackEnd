/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable arrow-body-style */
import status from "http-status";
import AppError from "../../../errors/AppError";
import {
  ILocation,
  IMechanicProfile,
  IWorkingHour,
  IWorkshop,
  IWorkShopLocation,
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
      location: userLocation,
      certificates,
      experience,
      phoneNumber,
      workshop,
      fullName,
    } = data;

    const { location, name, services, workingHours } = workshop as IWorkshop;

    if (userLocation && Object.keys(userLocation).length > 0) {
      const locations = removeFalsyFields(
        userLocation as unknown as Record<string, unknown>
      );
      console.log(locations);
      for (const field in locations) {
        mechanicProfile.location[field as keyof ILocation] = (
          locations as Record<string, string>
        )[field];
      }
    }
    console.log("object");
    if (location && Object.keys(location).length > 0) {
      const { coordinates, ...other } = location;
      const locations = removeFalsyFields(other) as Omit<
        IWorkShopLocation,
        "coordinates"
      >;
      for (const field in locations) {
        mechanicProfile.workshop.location[
          field as keyof Omit<IWorkShopLocation, "coordinates">
        ] = (locations as Record<string, string>)[field];
      }

      if (coordinates?.coordinates.length === 2) {
        mechanicProfile.workshop.location.coordinates.type = "Point";
        mechanicProfile.workshop.location.coordinates.coordinates =
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
      mechanicProfile.workshop.services = services;
    }

    if (phoneNumber) {
      mechanicProfile.phoneNumber = phoneNumber;
    }

    if (name) {
      mechanicProfile.workshop.name = name;
    }

    if (fullName) {
      mechanicProfile.fullName = fullName;
    }

    if (workingHours && Object.keys(workingHours).length > 0) {
      const newData = removeFalsyFields(workingHours as any);
      for (const field in newData) {
        mechanicProfile.workshop.workingHours[field as keyof IWorkingHour] =
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
