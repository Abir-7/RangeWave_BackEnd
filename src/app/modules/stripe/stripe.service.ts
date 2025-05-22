/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from "mongoose";
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import status from "http-status";
import AppError from "../../errors/AppError";

import { MechanicProfile } from "../users/mechanicProfile/mechanicProfile.model";

import { stripe } from "./stripe";
import { decrypt, encrypt } from "../../utils/helper/encrypt&decrypt";
import { appConfig } from "../../config";
import Bid from "../serviceFlow/bid/bid.model";

import { Status } from "../serviceFlow/service/service.interface";
import Payment from "./payment.model";
import { PaymentStatus } from "./payment.interface";
import { Service } from "../serviceFlow/service/service.model";

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

// its only use when hire mecanic function is call is service.service.ts file
const createPaymentIntent = async (bidId: string) => {
  const bidData = await Bid.findById(bidId);

  if (!bidData) {
    throw new AppError(status.NOT_FOUND, "Bid data not found");
  }

  const paymentData = {
    bidId,
  };
  await Payment.create(paymentData);

  const convertedAmount = bidData?.price * 100;
  const paymentIntent = await stripe.paymentIntents.create({
    amount: convertedAmount,
    currency: "usd",
    payment_method_types: ["card"],
  });

  return { client_secret: paymentIntent.client_secret };
};

const savePaymentData = async (data: { txId: string; bidId: string }) => {
  const { txId, bidId } = data;

  if (!txId || !bidId) {
    throw new AppError(
      status.NOT_FOUND,
      `Give provide ${!txId ? "txId" : "bidId"}`
    );
  }

  // Start a session
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Fetch Bid with populated fields (inside transaction session)
    const bidData = await Bid.findById(bidId)
      .populate({
        path: "reqServiceId",
      })
      .populate({
        path: "mechanicId",
        model: "MechanicProfile",
        localField: "mechanicId",
        foreignField: "user",
        select: "-location -certificates -experience   -__v",
      })
      .session(session);

    if (!bidData) {
      throw new AppError(status.NOT_FOUND, "Bid not found");
    }

    // Update Service status
    await Service.findOneAndUpdate(
      { _id: bidData.reqServiceId },
      { status: Status.WAITING },
      { new: true, session }
    );
    const newPaymentData = await Payment.findOneAndUpdate(
      { bidId: bidId },
      { txId, status: PaymentStatus.HOLD },
      { new: true, session } // <-- pass session here
    );

    if (!newPaymentData) {
      throw new AppError(
        status.NOT_FOUND,
        "Failed to update payment. Data not found"
      );
    }

    // Commit transaction
    await session.commitTransaction();
    await session.endSession();
    return await newPaymentData.populate({
      path: "bidId",
    });
  } catch (error: any) {
    console.log(error);
    await session.abortTransaction();
    await session.endSession();
    throw new Error(error);
  }
};

const refundPayment = async (bidId: string) => {
  const bidData = await Payment.findOne({ bidId: bidId });

  if (!bidData || !bidData.txId) {
    throw new AppError(status.BAD_REQUEST, "txId not found.");
  }

  const refund = await stripe.refunds.create({
    payment_intent: bidData.txId,
  });

  // Check refund status
  if (refund.status !== "succeeded") {
    throw new AppError(
      status.INTERNAL_SERVER_ERROR,
      "Refund not successful, status: " + refund.status
    );
  }
  // Optionally update your DB here to mark payment as refunded
  bidData.status = PaymentStatus.REFUNDED;
  await bidData.save();

  return refund;
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

export const StripeService = {
  createAndConnect,
  createPaymentIntent,
  savePaymentData,
  refundPayment,
};
