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

const updateMechanicProfile = async (
  email: string,
  data: Partial<IMechanicProfile>
): Promise<IMechanicProfile> => {
  const mechanicProfile = await MechanicProfile.findOne({ email: email });

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
    for (const fild in locations) {
      mechanicProfile.location[fild as keyof Omit<ILocation, "coordinates">] = (
        locations as Record<string, string>
      )[fild];
    }

    if (coordinates?.length === 2) {
      mechanicProfile.location.coordinates = coordinates;
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
    for (const fild in newData) {
      mechanicProfile.workingHours[fild as keyof IWorkingHour] = newData[fild];
    }
  }
  return await mechanicProfile.save();
};

export const MechanicProfileService = { updateMechanicProfile };
