import { Router } from "express";
import { auth } from "../../middleware/auth/auth";
import { StripeController } from "./stripe.controller";

const router = Router();
router.post(
  "/create-and-connect",
  auth("MECHANIC"),
  StripeController.createAndConnect
);
// router.post(
//   "/create-payment-intent",
//   auth("USER"),
//   StripeController.createPaymentIntent
// );

router.post("/save-payment", auth("USER"), StripeController.savePaymentData);
router.post("/refund-payment", auth("ADMIN"), StripeController.refundPayment);
export const StripeRoute = router;
