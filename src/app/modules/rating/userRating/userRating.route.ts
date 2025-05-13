import { Router } from "express";
import { auth } from "../../../middleware/auth/auth";
import { UserRatingController } from "./userRating.controller";

const router = Router();

router.post(
  "/add-rating-to-user",
  auth("MECHANIC"),
  UserRatingController.addRatingToUser
);

export const UserRatingRoute = router;
