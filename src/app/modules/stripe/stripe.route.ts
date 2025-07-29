import { Router } from "express";
import { auth } from "../../middleware/auth/auth";
import { StripeController } from "./stripe.controller";

const router = Router();
router.post(
  "/create-and-connect",
  auth("MECHANIC"),
  StripeController.createAndConnect
);

router.post(
  "/save-extra-work-payment",
  auth("USER"),
  StripeController.saveExtraWorkPayment
);
router.post("/refund-payment", auth("ADMIN"), StripeController.refundPayment);
export const StripeRoute = router;
