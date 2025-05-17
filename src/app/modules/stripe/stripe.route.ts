import { Router } from "express";
import { auth } from "../../middleware/auth/auth";
import { StripeController } from "./stripe.controller";

const router = Router();
router.post(
  "/create-and-connect",
  auth("MECHANIC"),
  StripeController.createAndConnect
);
export const StripeRoute = router;
