import { Router } from "express";
import { auth } from "../../../middleware/auth/auth";
import { UserProfileController } from "./userProfile.controller";
//import zodValidator from "../../../middleware/zodValidator";
//import { UserProfileUpdateSchema } from "./userProfile.validation";

const router = Router();

router.patch(
  "/update-user-profile",
  auth("USER"),
  //  zodValidator(UserProfileUpdateSchema),
  UserProfileController.updateUserProfile
);

export const UserProfileRoute = router;
