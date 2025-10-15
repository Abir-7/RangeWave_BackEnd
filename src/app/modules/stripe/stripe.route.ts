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
router.get(
  "/get-express-dashboard-link",
  auth("MECHANIC"),
  StripeController.getExpressDashboardLink
);

export const StripeRoute = router;
