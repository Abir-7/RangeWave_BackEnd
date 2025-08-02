/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import status from "http-status";
import AppError from "../../errors/AppError";

import { MechanicProfile } from "../users/mechanicProfile/mechanicProfile.model";

import { stripe } from "./stripe";
import { decrypt, encrypt } from "../../utils/helper/encrypt&decrypt";
import { appConfig } from "../../config";

import Payment from "./payment.model";
import { PaymentStatus } from "./payment.interface";

import logger from "../../utils/logger";
import Stripe from "stripe";
import User from "../users/user/user.model";
import { UserProfile } from "../users/userProfile/userProfile.model";

const createAndConnect = async (mechanicEmail: string) => {
  if (!mechanicEmail || !mechanicEmail.includes("@")) {
    throw new AppError(status.BAD_REQUEST, "Invalid email address");
  }

  // Step 1: Fetch mechanic profile
  const mechanicProfile = await MechanicProfile.findOne({
    email: mechanicEmail,
  });

  if (!mechanicProfile) {
    throw new AppError(status.NOT_FOUND, "Mechanic profile not found.");
  }

  let stripeAccountId: string;

  // Step 2: Check if Stripe account already exists
  if (mechanicProfile.stripeAccountId) {
    stripeAccountId = decrypt(mechanicProfile.stripeAccountId);
  } else {
    // Step 3: Create new Stripe account if not found
    const account = await stripe.accounts.create({
      country: "US",
      type: "express",
      email: mechanicEmail,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    // Step 4: Save new Stripe account ID to mechanic profile
    stripeAccountId = account.id;
    mechanicProfile.stripeAccountId = encrypt(account.id);
    await mechanicProfile.save();
  }

  // Step 5: Create onboarding link
  const accountLink = await stripe.accountLinks.create({
    account: stripeAccountId,
    refresh_url: `${appConfig.server.base_url}/stripe/onboarding/refresh`,
    return_url: `${appConfig.server.base_url}/stripe/onboarding/success`,
    type: "account_onboarding",
    collect: "eventually_due", // optional: ensures missing info is collected
  });

  return {
    url: accountLink.url,
    accountId: stripeAccountId,
  };
};

const createPaymentIntent = async (data: {
  price: number;
  accountId: string;
  serviceId: string;
  userId: string;
  bidId: string;
}) => {
  const user = await User.findById(data.userId);
  if (!user) throw new Error("User not found");

  const userProfile = await UserProfile.findOne({ user: user._id });
  if (!userProfile) throw new Error("User profile not found");
  // Get or create Stripe customer
  let stripeCustomerId = userProfile.stripeCustomerId;

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId: String(user._id) },
    });

    stripeCustomerId = customer.id;
    userProfile.stripeCustomerId = stripeCustomerId;
    await user.save();
  }

  // Check if a payment already exists
  const existingPayment = await Payment.findOne({
    bidId: data.bidId,
    serviceId: data.serviceId,
    user: data.userId,
  });

  // Try to reuse previous unpaid PaymentIntent
  if (existingPayment && existingPayment.status === PaymentStatus.UNPAID) {
    const stripeIntent = await stripe.paymentIntents.retrieve(
      existingPayment.txId
    );

    if (
      [
        "requires_payment_method",
        "requires_confirmation",
        "requires_action",
        "processing",
      ].includes(stripeIntent.status)
    ) {
      return {
        paymentIntent: stripeIntent.client_secret,
        customer: stripeCustomerId,
      };
    }

    // Delete outdated Payment record
    await Payment.findOneAndDelete({ _id: existingPayment._id });
  }

  const amount = Math.round(data.bidPrice * 100);

  const fee = Math.round(amount * 0.1); // 10% fee = 1000 cents

  // Create new Stripe PaymentIntent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount, // convert to cents
    currency: "usd",
    customer: stripeCustomerId,
    automatic_payment_methods: { enabled: true },
    capture_method: "manual", // authorize only
    application_fee_amount: fee,
    transfer_data: {
      destination: data.accountId, // <--- add this!
    },
    metadata: {
      bidId: data.bidId.toString(),
      serviceId: data.serviceId.toString(),
      userId: data.userId,
      isForExtraWork: data.isForExtraWork ? "yes" : "no",
      mechanicId: data.mechanicId,
    },
  });

  // Save in DB
  await Payment.create({
    bidId: data.bidId,
    serviceId: data.serviceId,
    user: data.userId,
    txId: paymentIntent.id,
    status: PaymentStatus.UNPAID,
  });

  return {
    paymentIntent: paymentIntent.client_secret,
  };
};

const stripeWebhook = async (rawBody: Buffer, sig: string) => {
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      appConfig.stripe.webhook as string
    );
  } catch (err) {
    logger.error(`Webhook signature verification failed:${err}`);
    throw new Error("Webhook signature verification failed.");
  }
  logger.info(event.type);

  switch (event.type) {
    case "payment_intent.succeeded": {
      // const paymentIntent = event.data.object as Stripe.PaymentIntent;

      break;
    }

    case "payment_intent.payment_failed":
    case "payment_intent.canceled": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const metadata = paymentIntent.metadata;

      logger.warn(`Payment ${event.type} for Bid ID: ${metadata.bidId}`);

      if (metadata.isForExtraWork === "no") {
        await Payment.findOneAndUpdate(
          {
            bidId: metadata.bidId,
            serviceId: metadata.serviceId,
            txId: paymentIntent.id,
          },
          {
            status: PaymentStatus.CANCELLED,
          }
        );
      }

      break;
    }

    default:
      logger.info(`ℹ️ Unhandled event type: ${event.type}`);
  }
};

export const StripeService = {
  createAndConnect,
  createPaymentIntent,

  stripeWebhook,
};
