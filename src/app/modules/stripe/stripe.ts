// src/config/stripe.ts
import Stripe from "stripe";
import { appConfig } from "../../config";

export const stripe = new Stripe(appConfig.stripe.secret_key!, {
  apiVersion: "2025-04-30.basil",
});
