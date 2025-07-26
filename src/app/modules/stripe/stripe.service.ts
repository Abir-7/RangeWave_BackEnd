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
import { getSocket } from "../../socket/socket";
import logger from "../../utils/logger";
import Stripe from "stripe";
import User from "../users/user/user.model";

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

const savePaymentData = async (
  data: { txId: string; bidId: string; serviceId: string },
  userId: string
) => {
  const { txId, bidId, serviceId } = data;

  if (!txId || !bidId) {
    throw new AppError(status.NOT_FOUND, `provide ${!txId ? "txId" : "bidId"}`);
  }

  // Start a session
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Fetch Bid with populated fields (inside transaction session)
    const bidData = (await Bid.findOne({ bidId, reqServiceId: serviceId })
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

    await createRoomAfterHire(users, session);

    const newPaymentData = await Payment.findOneAndUpdate(
      { bidId, serviceId },
      { txId, status: PaymentStatus.HOLD },
      { new: true, session } // <-- pass session here
    );

    if (!newPaymentData) {
      throw new AppError(
        status.NOT_FOUND,
        "Failed to update payment. Data not found"
      );
    }

    const io = getSocket();
    io.emit("new-hire", { paymentId: newPaymentData._id });

    // Commit transaction
    await session.commitTransaction();
    await session.endSession();
    return await newPaymentData.populate({
      path: "bidId",
      populate: "reqServiceId",
    });
  } catch (error: any) {
    console.log(error);
    await session.abortTransaction();
    await session.endSession();
    throw new Error(error);
  }
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
}) => {
  const user = await User.findById(data.userId);

  if (!user) throw new Error("User not found");

  let stripeCustomerId = user.stripeCustomerId;

  // 2. Create Stripe Customer if not exists
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: {
        userId: String(user._id),
      },
    });

    stripeCustomerId = customer.id;

    // 3. Save Stripe customer ID to your user record
    user.stripeCustomerId = stripeCustomerId;
    await user.save();
  }

  // 4. Create Checkout Session linked to the Stripe customer
  const convertedAmount = Math.round(data.bidPrice * 100);

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    customer: stripeCustomerId, // associate session with existing customer
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: data.isForExtraWork ? "Extra Work Payment" : "Bid Payment",
          },
          unit_amount: convertedAmount,
        },
        quantity: 1,
      },
    ],
    metadata: {
      bidId: data.bidId.toString(),
      isForExtraWork: data.isForExtraWork ? "yes" : "no",
      serviceId: data.serviceId.toString(),
      userId: data.userId,
    },
    success_url:
      "https://yourdomain.com/payment-success?session_id={CHECKOUT_SESSION_ID}",
    cancel_url: "https://yourdomain.com/payment-cancelled",
  });

  return { sessionId: session.id, url: session.url };
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
    case "checkout.session.completed": {
      console.log("Hit");

      const session = event.data.object as Stripe.Checkout.Session;

      // Access metadata
      const bidId = session.metadata?.bidId;
      const isForExtraWork = session.metadata?.isForExtraWork;
      const serviceId = session.metadata?.serviceId;

      console.log(bidId, isForExtraWork, serviceId);

      //      if (paymentIntent) {
      //   const datas = await Payment.findOne({
      //     ...data,
      //   });

      //   if (!datas) {
      //     await Payment.create({
      //       bidId: data.bidId,
      //       status: PaymentStatus.UNPAID,
      //       serviceId: bidData.reqServiceId,
      //     });
      //   }

      //   if (
      //     datas &&
      //     (datas.status === PaymentStatus.HOLD ||
      //       datas.status === PaymentStatus.REFUNDED ||
      //       datas.status === PaymentStatus.PAID ||
      //       datas.status === PaymentStatus.CANCELLED)
      //   ) {
      //     throw new AppError(
      //       status.BAD_REQUEST,
      //       `Payment for this bid status is: ${datas.status}`
      //     );
      //   }
      // } else {
      //   throw new AppError(status.BAD_REQUEST, "Failed to create client secret.");
      // }
    }
  }
};

export const StripeService = {
  createAndConnect,
  createPaymentIntent,
  savePaymentData,
  refundPayment,
  saveExtraWorkPayment,
  stripeWebhook,
};
