/* eslint-disable arrow-body-style */
import { IUserProfile } from "./userProfile.interface";

const updateUserProfile = async (
  email: string,
  data: Partial<IUserProfile>
): Promise<IUserProfile> => {
  return { ...data } as IUserProfile;
};

export const UserProfileService = { updateUserProfile };
