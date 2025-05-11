import { Router } from "express";
import { auth } from "../../../middleware/auth/auth";
import { MechanicProfileController } from "./mechanicProfile.controller";

const router = Router();

router.patch(
  "/update-mechanic-profile",
  auth("MECHANIC"),
  MechanicProfileController.updateMechanicProfile
);

export const MechanicProfileRoute = router;
