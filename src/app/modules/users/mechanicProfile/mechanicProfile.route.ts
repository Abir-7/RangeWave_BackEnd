import { Router } from "express";
import { auth } from "../../../middleware/auth/auth";
import { MechanicProfileController } from "./mechanicProfile.controller";
import zodValidator from "../../../middleware/zodValidator";
import { MechanicProfileUpdateSchema } from "./mechanicProfile.validation";

const router = Router();

router.patch(
  "/update-mechanic-profile",
  auth("MECHANIC"),
  zodValidator(MechanicProfileUpdateSchema),
  MechanicProfileController.updateMechanicProfile
);

export const MechanicProfileRoute = router;
