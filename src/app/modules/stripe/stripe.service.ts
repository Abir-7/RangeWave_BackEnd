/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose, { Types } from "mongoose";
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
import { createRoomAfterHire } from "../chat/room/room.service";

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

  const convertedAmount = bidData?.price * 100;
  const paymentIntent = await stripe.paymentIntents.create({
    amount: convertedAmount,
    currency: "usd",
    payment_method_types: ["card"],
    metadata: {
      bidId,
    },
  });

  return { client_secret: paymentIntent.client_secret };
};

const savePaymentData = async (
  data: { txId: string; bidId: string },
  userId: string
) => {
  const { txId, bidId } = data;

  if (!txId || !bidId) {
    throw new AppError(status.NOT_FOUND, `provide ${!txId ? "txId" : "bidId"}`);
  }

  // Start a session
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Fetch Bid with populated fields (inside transaction session)
    const bidData = (await Bid.findById(bidId)
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
      .session(session)) as any;

    console.log(bidData);

    if (!bidData) {
      throw new AppError(status.NOT_FOUND, "Bid not found");
    }

    // Update Service status
    const serviceData = await Service.findOneAndUpdate(
      { _id: bidData.reqServiceId._id },
      { status: Status.WAITING },
      { new: true, session }
    );

    // Assuming you modify createRoom to accept session or it internally uses session

    if (!serviceData) {
      throw new Error("Service not found.");
    }

    const users = [userId.toString(), bidData.mechanicId.user.toString()] as [
      string,
      string
    ];

    console.log(users);
    await createRoomAfterHire(users, session);

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

const refundPayment = async (
  bidId: string | Types.ObjectId,
  session?: mongoose.ClientSession
) => {
  const bidData = await Payment.findOne({ bidId: bidId }).session(
    session ?? null
  );

  if (!bidData || !bidData.txId) {
    throw new AppError(status.BAD_REQUEST, "txId not found.");
  }

  const refund = await stripe.refunds.create({
    payment_intent: bidData.txId,
  });

  if (refund.status !== "succeeded") {
    throw new AppError(
      status.INTERNAL_SERVER_ERROR,
      "Refund not successful, status: " + refund.status
    );
  }

  bidData.status = PaymentStatus.REFUNDED;
  await bidData.save({ session });

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

// used in service section : mark as completed function
export const payToMechanic = async (sId: string | Types.ObjectId) => {
  const bidData = await Bid.findOne({ reqServiceId: sId });
  if (!bidData) {
    throw new Error("Bid data not found");
  }
  const paymentRecord = await Payment.findOne({ bidId: bidData?._id });
  if (!paymentRecord || !paymentRecord.txId) {
    throw new Error("Payment or txId not found");
  }

  const mechanicProfile = await MechanicProfile.findById(bidData.mechanicId);
  if (!mechanicProfile || !mechanicProfile.stripeAccountId) {
    throw new Error("Mechanic Stripe ID missing");
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(
    paymentRecord.txId
  );
  if (paymentIntent.status !== "succeeded") {
    throw new Error("Payment not successful");
  }

  const stripeAccountId = decrypt(mechanicProfile.stripeAccountId);

  const amountToTransfer = Math.floor(paymentIntent.amount_received * 0.9);

  const transfer = await stripe.transfers.create({
    amount: amountToTransfer,
    currency: paymentIntent.currency,
    destination: stripeAccountId,
    description: `Payout for bid ${bidData._id}`,
  });

  paymentRecord.status = PaymentStatus.PAID;
  paymentRecord.transferId = transfer.id;
  await paymentRecord.save();
  return transfer;
};
