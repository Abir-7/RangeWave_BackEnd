export interface IAuthData {
  userEmail: string;
  userId: string;
  userRole: TUserRole;
}

export const userRoles = {
  ADMIN: "ADMIN",
  USER: "USER",
  MECHANIC: "MECHANIC",
} as const;

export const userRole = Object.values(userRoles);

export type TUserRole = keyof typeof userRoles;
