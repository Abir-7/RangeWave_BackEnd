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
import { ExtraWork } from "../serviceFlow/extraWork/extraWork.model";
import { ExtraWorkStatus } from "../serviceFlow/extraWork/extraWork.interface";

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

const createPaymentIntentForExtraWork = async (data: {
  pId: string;
  isForExtraWork: boolean;
  extraWorkId: string;
}) => {
  const payment = await Payment.findById(data.pId);
  console.log("object 1");
  if (!payment) throw new Error("Payment not found");

  // Step 1: Check if valid txId exists and is usable
  if (payment.extraPay?.txId) {
    const existingIntent = await stripe.paymentIntents.retrieve(
      payment.extraPay.txId
    );

    const validStatuses = [
      "requires_payment_method",
      "requires_confirmation",
      "requires_action",
    ];

    if (
      existingIntent &&
      validStatuses.includes(existingIntent.status) &&
      payment.extraPay.status === PaymentStatus.UNPAID
    ) {
      return { paymentIntent: existingIntent.client_secret };
    }
  }

  // Step 2: Fetch extra work info from DB
  const extraWork = await ExtraWork.findOne({
    _id: data.extraWorkId,
    status: ExtraWorkStatus.WAITING,
  });

  if (!extraWork) throw new Error("Extra work not found");

  const amount = Math.round(extraWork.price * 100); // cents

  console.log(extraWork.mechanicId);
  // Step 3: Create new payment intent

  const mechaProfile = await MechanicProfile.findOne({
    user: extraWork.mechanicId,
  });
  if (!mechaProfile) throw new Error("Mechanic Profile not found");

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: "usd",
    automatic_payment_methods: { enabled: true },
    capture_method: "manual", // or "manual" if you want to capture later
    transfer_data: {
      destination: decrypt(mechaProfile.stripeAccountId), // <--- add this!
    },
    metadata: {
      pId: data.pId,
      isForExtraWork: data.isForExtraWork ? "yes" : "no",
      extraWorkId: data.extraWorkId,
    },
  });

  // Step 4: Save new txId and status to Payment.extraPay
  payment.extraPay = {
    extraWorkId: extraWork._id,
    txId: paymentIntent.id,
    status: PaymentStatus.UNPAID,
    isPaymentTransfered: false,
  };

  await payment.save();
  console.log("object");
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
    // case "payment_intent.succeeded": {
    //   const paymentIntent = event.data.object as Stripe.PaymentIntent;

    //   break;
    // }
    case "transfer.created": {
      const transfer = event.data.object as Stripe.Transfer;

      const chargeId = transfer.source_transaction;

      if (!chargeId) {
        throw new Error("No source_transaction found on transfer");
        break;
      }

      const charge = await stripe.charges.retrieve(chargeId as string);

      const paymentIntentId =
        typeof charge.payment_intent === "string"
          ? charge.payment_intent
          : charge.payment_intent?.id;

      if (!paymentIntentId) {
        throw new Error("No PaymentIntent found for charge");
        break;
      }

      await Payment.findOneAndUpdate(
        { txId: paymentIntentId },
        { isPaymentTransfered: true }
      );

      break;
    }
    case "charge.captured": {
      const charge = event.data.object as Stripe.Charge;

      const paymentIntentId =
        typeof charge.payment_intent === "string"
          ? charge.payment_intent
          : charge.payment_intent?.id;

      if (!paymentIntentId) {
        logger.error("Charge has no associated payment_intent");
        break;
      }

      const paymentIntent = await stripe.paymentIntents.retrieve(
        paymentIntentId
      );
      const metadata = paymentIntent.metadata;

      if (metadata.isForExtraWork === "no") {
        if (!paymentIntentId) {
          logger.error("Captured charge is missing paymentIntent reference.");
          break;
        }

        await Payment.findOneAndUpdate(
          { txId: paymentIntentId },
          { isPaymentTransfered: true }
        );
        break;
      }

      if (metadata.isForExtraWork === "yes") {
        const pId = metadata.pId;
        const paymentData = await Payment.findOne({ _id: pId });

        if (!paymentData) {
          throw new AppError(
            status.NOT_FOUND,
            "Payment data not found for extra pay"
          );
        }
        paymentData.extraPay.isPaymentTransfered = true;
        break;
      }

      break;
    }

    case "charge.succeeded": {
      const charge = event.data.object as Stripe.Charge;

      const paymentIntentId =
        typeof charge.payment_intent === "string"
          ? charge.payment_intent
          : charge.payment_intent?.id;

      if (!paymentIntentId) {
        logger.error("Charge has no associated payment_intent");
        break;
      }

      const paymentIntent = await stripe.paymentIntents.retrieve(
        paymentIntentId
      );
      const metadata = paymentIntent.metadata;

      if (metadata.isForExtraWork === "no") {
        await handleSuccessfulPaymentIntent(paymentIntent);
      }

      if (metadata.isForExtraWork === "yes" && metadata.extraWorkId) {
        const pId = metadata.pId;
        const eId = metadata.extraWorkId;

        const paymentData = await Payment.findOne({ _id: pId });
        if (!paymentData) {
          throw new AppError(
            status.NOT_FOUND,
            "Payment data not found for extra pay"
          );
        }
        paymentData.extraPay.status = PaymentStatus.PAID;

        const eWorkData = await ExtraWork.findOne({ _id: eId });

        if (!eWorkData) {
          throw new AppError(
            status.NOT_FOUND,
            "Extra work data not found for extra pay"
          );
        }
        eWorkData.status = ExtraWorkStatus.ACCEPTED;
      }

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
  createPaymentIntentForExtraWork,

  refundPayment,

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
