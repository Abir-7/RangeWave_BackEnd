/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose, { Types } from "mongoose";
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import status from "http-status";
import AppError from "../../errors/AppError";

import { MechanicProfile } from "../users/mechanicProfile/mechanicProfile.model";

import { stripe } from "./stripe";
import { decrypt, encrypt } from "../../utils/helper/encrypt&decrypt";
import { appConfig } from "../../config";

import { Status } from "../serviceFlow/service/service.interface";
import Payment from "./payment.model";
import { PaymentStatus } from "./payment.interface";
import { Service } from "../serviceFlow/service/service.model";
import { createRoomAfterHire } from "../chat/room/room.service";
import { getSocket } from "../../socket/socket";
import logger from "../../utils/logger";
import Stripe from "stripe";
import User from "../users/user/user.model";
import { UserProfile } from "../users/userProfile/userProfile.model";

const createAndConnect = async (mechanicEmail: string) => {
  const account = await stripe.accounts.create({
    country: "US",
    type: "express",
    email: mechanicEmail,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });

  const updatedMechanicProfile = await MechanicProfile.findOneAndUpdate(
    { email: mechanicEmail },
    { stripeAccountId: encrypt(account.id) },
    { new: true }
  );

  if (!updatedMechanicProfile) {
    throw new AppError(status.NOT_FOUND, "Profile not found.");
  }

  const accountLink = await stripe.accountLinks.create({
    account: decrypt(updatedMechanicProfile?.stripeAccountId),
    refresh_url: `${appConfig.server.base_url}/stripe/onboarding/refresh`,
    return_url: `${appConfig.server.base_url}/stripe/onboarding/success`,
    type: "account_onboarding",
  });
  return { url: accountLink.url, accountId: account.id };
};

const refundPayment = async (txId: string) => {
  const refund = await stripe.refunds.create({
    payment_intent: txId,
  });

  if (refund.status !== "succeeded") {
    throw new AppError(
      status.INTERNAL_SERVER_ERROR,
      "Refund not successful, status: " + refund.status
    );
  }

  return refund;
};

const saveExtraWorkPayment = async (sId: string, txId: string) => {
  const saveData = await Payment.findOne({ serviceId: sId });
  if (!saveData) {
    throw new AppError(status.NOT_FOUND, "payment data not found.");
  }

  saveData.extraPay.status = PaymentStatus.HOLD;
  saveData.extraPay.txId = txId;
  return await saveData.save();
};

// const getExpressAccountLoginLink = async (userId: string) => {
//   const userData = await MechanicProfile.findOne({ user: userId });

//   if (!userData) {
//     throw new AppError(status.NOT_FOUND, "Profile not found.");
//   }

//   const stripeAccountId = decrypt(userData.stripeAccountId);
//   const loginLink = await stripe.accounts.createLoginLink(stripeAccountId);
//   return loginLink.url;
// };

// its only use when hire mecanic function is call is service.service.ts file
const createPaymentIntent = async (data: {
  bidId: string | Types.ObjectId;
  isForExtraWork: boolean;
  bidPrice: number;
  serviceId: string | Types.ObjectId;
  userId: string;
  mechanicId: string;
  accountId: string;
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

  if (
    existingPayment &&
    [
      PaymentStatus.HOLD,
      PaymentStatus.REFUNDED,
      PaymentStatus.PAID,
      PaymentStatus.CANCELLED,
    ].includes(existingPayment.status)
  ) {
    throw new AppError(
      status.BAD_REQUEST,
      `Payment for this bid status is: ${existingPayment.status}`
    );
  }

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
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      await handleSuccessfulPaymentIntent(paymentIntent);

      break;
    }

    case "payment_intent.payment_failed":
    case "payment_intent.canceled": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const metadata = paymentIntent.metadata;

      logger.warn(`❌ Payment ${event.type} for Bid ID: ${metadata.bidId}`);

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

      break;
    }

    default:
      logger.info(`ℹ️ Unhandled event type: ${event.type}`);
  }
};

export const StripeService = {
  createAndConnect,
  createPaymentIntent,

  refundPayment,
  saveExtraWorkPayment,
  stripeWebhook,
};

const handleSuccessfulPaymentIntent = async (
  paymentIntent: Stripe.PaymentIntent
) => {
  const metadata = paymentIntent.metadata;

  logger.info("✅ Payment succeeded for Bid ID:", metadata.bidId);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const updatedPayment = await Payment.findOneAndUpdate(
      {
        bidId: metadata.bidId,
        serviceId: metadata.serviceId,
        txId: paymentIntent.id,
        user: metadata.userId,
      },
      {
        status: PaymentStatus.PAID,
        txId: paymentIntent.id,
      },
      { session, new: true }
    );

    await Service.findOneAndUpdate(
      { _id: metadata.serviceId },
      { status: Status.WAITING },
      { session }
    );

    await createRoomAfterHire(
      [metadata.userId as string, metadata.mechanicId as string],
      session
    );

    await session.commitTransaction();
    session.endSession();

    if (updatedPayment) {
      const io = getSocket();
      io.emit("new-hire", { paymentId: updatedPayment._id });
    }
  } catch (error) {
    logger.error("❌ Transaction failed for payment success:", error);
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};
