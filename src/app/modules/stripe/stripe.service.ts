/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import status from "http-status";
import AppError from "../../errors/AppError";

import { MechanicProfile } from "../users/mechanicProfile/mechanicProfile.model";

import { stripe } from "./stripe";
import { decrypt, encrypt } from "../../utils/helper/encrypt&decrypt";
import { appConfig } from "../../config";

import Payment from "./payment.model";
import { PaymentStatus, PaymentType } from "./payment.interface";

import logger from "../../utils/logger";
import Stripe from "stripe";
import User from "../users/user/user.model";
import { UserProfile } from "../users/userProfile/userProfile.model";
import { Service } from "../serviceFlow/service/service.model";
import { IsServiceCompleted } from "../serviceFlow/service/service.interface";
import mongoose from "mongoose";
import { getSocket } from "../../socket/socket";

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

  const account = await stripe.accounts.retrieve(stripeAccountId);
  let isAccountActive = false;
  if (!account.charges_enabled || !account.payouts_enabled) {
    isAccountActive = false;
  } else {
    isAccountActive = true;
  }

  return {
    url: accountLink.url,
    accountId: stripeAccountId,
    isAccountActive,
  };
};

const createPaymentIntent = async (pId: string) => {
  const paymentData = await Payment.findOne({
    _id: pId,
    status: PaymentStatus.UNPAID,
  });

  if (!paymentData) {
    throw new AppError(status.NOT_FOUND, "Payment data not found.");
  }

  const totalCost =
    (paymentData?.amount || 0) + (paymentData?.extraAmount || 0);

  if (totalCost === 0) {
    throw new AppError(status.BAD_REQUEST, "Total amount can't be zero.");
  }

  const mechanicData = await MechanicProfile.findOne({
    user: paymentData.mechanicId,
  });

  if (!mechanicData) {
    throw new AppError(status.NOT_FOUND, "Mechanic profile not found.");
  }
  if (!mechanicData.stripeAccountId) {
    throw new AppError(status.NOT_FOUND, "Mechanic stripe account not found.");
  }

  // If already created, return client_secret if still pending
  if (paymentData.txId) {
    const existingIntent = await stripe.paymentIntents.retrieve(
      paymentData.txId
    );
    if (
      [
        "requires_payment_method",
        "requires_confirmation",
        "requires_action",
        "processing",
      ].includes(existingIntent.status)
    ) {
      return {
        paymentIntent: existingIntent.client_secret,
      };
    }
  }

  // --- Begin Internal PaymentIntent Creation Logic ---
  const user = await User.findById(paymentData.user);
  if (!user) throw new AppError(status.NOT_FOUND, "User not found.");

  const userProfile = await UserProfile.findOne({ user: user._id });
  if (!userProfile)
    throw new AppError(status.NOT_FOUND, "User profile not found.");

  let stripeCustomerId = userProfile.stripeCustomerId;

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId: String(user._id) },
    });
    stripeCustomerId = customer.id;
    userProfile.stripeCustomerId = stripeCustomerId;
    await userProfile.save();
  }

  const connectedAccount = await stripe.accounts.retrieve(
    decrypt(mechanicData.stripeAccountId)
  );
  if (!connectedAccount || (connectedAccount as any).deleted) {
    throw new AppError(status.NOT_FOUND, "Invalid connected account.");
  }

  const newPaymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(totalCost * 100),
    currency: "usd",
    customer: stripeCustomerId,
    automatic_payment_methods: { enabled: true },
    transfer_data: {
      destination: decrypt(mechanicData.stripeAccountId),
    },
    metadata: {
      bidId: String(paymentData.bidId),
      serviceId: String(paymentData.serviceId),
      userId: String(paymentData.user),
      mechanicId: String(paymentData.mechanicId),
      paymentId: pId,
    },
  });

  await Payment.findByIdAndUpdate(pId, {
    txId: newPaymentIntent.id,
    paymentType: PaymentType.ONLINE,
  });

  return {
    paymentIntent: newPaymentIntent.client_secret,
  };
};

const zoneExclusivePayment = async (mechanicId: string) => {
  try {
    const totalCost = 10; // USD
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalCost * 100), // Stripe expects cents
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata: { mechanicId }, // attach mechanic info
    });

    return {
      clientSecret: paymentIntent.client_secret, // send to frontend
      paymentIntentId: paymentIntent.id,
    };
  } catch (error) {
    logger.error("Stripe PaymentIntent error:", error);
    throw new Error("Payment initialization failed");
  }
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
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const metadata = paymentIntent.metadata;

        const { bidId, serviceId, paymentId, mechanicId } = metadata;

        if (bidId && serviceId && paymentId) {
          const serviceData = await Service.findOne({
            _id: serviceId,
            bidId,
          }).session(session);
          if (!serviceData) {
            throw new AppError(status.NOT_FOUND, "Service data not found.");
          }

          serviceData.isServiceCompleted = IsServiceCompleted.YES;

          await Promise.all([
            Payment.findByIdAndUpdate(paymentId, {
              status: PaymentStatus.PAID,
            }).session(session),
            serviceData.save({ session }),
          ]);

          await session.commitTransaction();
          session.endSession();
        }

        if (mechanicId) {
          //!
          const mechanicData = await MechanicProfile.findOne({
            user: mechanicId,
          });
          if (!mechanicData) {
            throw new AppError(404, "Mechanic data not found.");
          }
          mechanicData.isNeedToPayForWorkShop = false;
          await mechanicData.save();
        }
        //--------------------------------- socket need----------------------------
        const io = getSocket();
        io.emit(`progress-${paymentId}`, {
          paymentId: paymentId,
        });
      } catch (err) {
        await session.abortTransaction();
        session.endSession();
        throw err;
      }

      break;
    }

    case "payment_intent.payment_failed":
    case "payment_intent.canceled": {
      break;
    }

    default:
      logger.info(`Unhandled event type: ${event.type}`);
  }
};

export const StripeService = {
  createAndConnect,
  createPaymentIntent,
  zoneExclusivePayment,
  stripeWebhook,
};
