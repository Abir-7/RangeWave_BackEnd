import { Router } from "express";
import { auth } from "../../../middleware/auth/auth";
import { UserProfileController } from "./userProfile.controller";

const router = Router();

router.patch(
  "/update-user-profile",
  auth("USER"),
  UserProfileController.updateUserProfile
);

export const UserProfileRoute = router;
