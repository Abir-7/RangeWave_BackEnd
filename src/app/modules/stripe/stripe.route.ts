import { Router } from "express";
import { auth } from "../../middleware/auth/auth";
import { StripeController } from "./stripe.controller";

const router = Router();

router.post(
  "/create-and-connect",
  auth("MECHANIC"),
  StripeController.createAndConnect
);
router.get(
  "/zone-exclusive",
  auth("MECHANIC"),
  StripeController.zoneExclusivePayment
);

export const StripeRoute = router;
