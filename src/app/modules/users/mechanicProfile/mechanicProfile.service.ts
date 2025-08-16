/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
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
  const session = await startSession();
  session.startTransaction();

  try {
    const mechanicProfile = await MechanicProfile.findOne({ email }).session(
      session
    );

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

    // --- Update top-level location ---
    if (userLocation && Object.keys(userLocation).length > 0) {
      const locations = removeFalsyFields(
        userLocation as unknown as Record<string, unknown>
      );
      for (const field in locations) {
        mechanicProfile.location[field as keyof ILocation] = locations[
          field
        ] as string;
      }
    }

    // --- Update workshop data ---
    if (workshop) {
      const { location, name, services, workingHours } = workshop as IWorkshop;

      mechanicProfile.workshop = mechanicProfile.workshop || ({} as IWorkshop);

      // --- Workshop location ---
      if (location && Object.keys(location).length > 0) {
        const { coordinates, ...other } = location;
        mechanicProfile.workshop.location =
          mechanicProfile.workshop.location || ({} as IWorkShopLocation);

        const locFields = removeFalsyFields(other) as Omit<
          IWorkShopLocation,
          "coordinates"
        >;
        for (const field in locFields) {
          mechanicProfile.workshop.location[
            field as keyof Omit<IWorkShopLocation, "coordinates">
          ] = (locFields as any)[field] as string;
        }

        // Validate coordinates before saving
        if (coordinates?.coordinates?.length === 2) {
          const [lng, lat] = coordinates.coordinates;
          if (
            typeof lng === "number" &&
            typeof lat === "number" &&
            lng >= -180 &&
            lng <= 180 &&
            lat >= -90 &&
            lat <= 90
          ) {
            mechanicProfile.workshop.location.coordinates = {
              type: "Point",
              coordinates: [lng, lat],
            };

            const isWorkshopPresent = await checkWorkshopLocation(
              [lng, lat],
              100,
              email
            );

            if (isWorkshopPresent) {
              mechanicProfile.isNeedToPayForWorkShop = true;
            }
          } else {
            throw new AppError(
              status.BAD_REQUEST,
              "Invalid coordinates provided"
            );
          }
        }
      }

      // --- Workshop services ---
      if (services) {
        mechanicProfile.workshop.services = services; // allow empty array to clear
      }

      // --- Workshop name ---
      if (name) {
        mechanicProfile.workshop.name = name;
      }

      // --- Workshop working hours ---
      if (workingHours && Object.keys(workingHours).length > 0) {
        mechanicProfile.workshop.workingHours =
          mechanicProfile.workshop.workingHours || ({} as IWorkingHour);
        const newData = removeFalsyFields(workingHours as Record<string, any>);
        for (const field in newData) {
          mechanicProfile.workshop.workingHours[field as keyof IWorkingHour] =
            newData[field];
        }
      }
    }

    // --- Certificates ---
    if (certificates) {
      mechanicProfile.certificates = certificates; // allow empty array
    }

    // --- Experience ---
    if (experience) {
      mechanicProfile.experience = experience; // allow empty array
    }

    // --- Phone number ---
    if (phoneNumber) {
      mechanicProfile.phoneNumber = phoneNumber;
    }

    // --- Full name ---
    if (fullName) {
      mechanicProfile.fullName = fullName;
    }

    // --- Update User doc to mark profile updated ---
    await User.findByIdAndUpdate(
      mechanicProfile.user,
      { needToUpdateProfile: false },
      { new: true, session }
    );

    await mechanicProfile.save({ session });
    await session.commitTransaction();
    return mechanicProfile;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const MechanicProfileService = { updateMechanicProfile };

// helper-----------------------------

export const checkWorkshopLocation = async (
  coordinates: [number, number], // [longitude, latitude]
  maxDistanceMeters: number,
  currentUserEmail?: string // user who is updating
) => {
  const query: any = {
    "workshop.location.coordinates": {
      $near: {
        $geometry: {
          type: "Point",
          coordinates,
        },
        $maxDistance: maxDistanceMeters,
      },
    },
  };

  // Exclude workshops of the current user
  if (currentUserEmail) {
    query.email = { $ne: currentUserEmail };
  }

  const existingWorkshop = await MechanicProfile.findOne(query);

  if (existingWorkshop) {
    return true;
  }

  return false;
};
