import { Router } from "express";
import { auth } from "../../../middleware/auth/auth";
import { UserProfileController } from "./userProfile.controller";

const router = Router();

router.patch(
  "/update-mechanic-profile",
  auth("MECHANIC"),
  UserProfileController.updateUserProfile
);

export const MechanicProfileRoute = router;
