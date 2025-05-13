import { Router } from "express";
import { auth } from "../../../middleware/auth/auth";
import { MechanicRatingController } from "./mechanicRating.controller";

const router = Router();

router.post(
  "/add-rating-to-mechanic",
  auth("USER"),
  MechanicRatingController.addRatingToMechanic
);

export const MechanicRatingRoute = router;
