/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import status from "http-status";
import AppError from "../../../errors/AppError";
import { Service } from "../service/service.model";
import mongoose from "mongoose";
import { getSocket } from "../../../socket/socket";
import { ExtraWork } from "./extraWork.model";
import { Status } from "../service/service.interface";
import { ExtraWorkStatus } from "./extraWork.interface";

import { StripeService } from "../../stripe/stripe.service";
import Payment from "../../stripe/payment.model";
import { PaymentStatus } from "../../stripe/payment.interface";

const reqForExtraWork = async (
  sId: string,
  data: {
    price: number;
    issue: string;
    description: string;
  }
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const serviceData = await Service.findById(sId).session(session);

    if (!serviceData) {
      throw new AppError(status.NOT_FOUND, "Service not found");
    }

    if (serviceData.status !== Status.WORKING) {
      throw new AppError(
        status.BAD_REQUEST,
        "You can req for extra work when service status is working."
      );
    }

    const extraWork = await ExtraWork.create([{ ...data, reqServiceId: sId }], {
      session,
    });

    serviceData.extraWork = extraWork[0]._id;
    await serviceData.save({ session });

    const io = getSocket();
    // socket-emit
    io.emit("extra-work", { serviceId: sId });

    await session.commitTransaction();
    session.endSession();

    return extraWork[0];
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

const rejectReqForExtrawork = async (sId: string) => {
  const [service, extraWork] = await Promise.all([
    Service.findById(sId),
    ExtraWork.findOne({ reqServiceId: sId }),
  ]);

  if (!service) {
    throw new AppError(status.NOT_FOUND, "Service not found");
  }

  if (!extraWork) {
    throw new AppError(status.NOT_FOUND, "Extra work request not found");
  }

  if (extraWork._id.toString() !== service.extraWork?.toString()) {
    throw new AppError(
      status.BAD_REQUEST,
      "Extra work request doesn't match the service"
    );
  }
  if (extraWork.status !== ExtraWorkStatus.WAITING) {
    throw new AppError(
      status.NOT_FOUND,
      `Extra work status already is ${extraWork.status}`
    );
  }

  extraWork.status = ExtraWorkStatus.REJECTED;
  const io = getSocket();
  io.emit("extra-work-reject", { serviceId: sId });
  return await extraWork.save();
};

const acceptReqForExtrawork = async (sId: string) => {
  const [service, extraWork, paymentData] = await Promise.all([
    Service.findById(sId),
    ExtraWork.findOne({ reqServiceId: sId }),
    Payment.findOne({ serviceId: sId }),
  ]);

  if (!service) {
    throw new AppError(status.NOT_FOUND, "Service not found");
  }

  if (!extraWork) {
    throw new AppError(status.NOT_FOUND, "Extra work request not found");
  }

  if (extraWork._id.toString() !== service.extraWork?.toString()) {
    throw new AppError(
      status.BAD_REQUEST,
      "Extra work request doesn't match the service"
    );
  }

  if (!paymentData) {
    throw new AppError(status.NOT_FOUND, "Main payment data in not found.");
  }

  if (paymentData && paymentData.status !== PaymentStatus.HOLD) {
    throw new AppError(
      status.BAD_REQUEST,
      "Extra work request can't accept.Main payment is not in hold status."
    );
  }

  if (extraWork.status !== ExtraWorkStatus.WAITING) {
    throw new AppError(
      status.NOT_FOUND,
      `Extra work status already is ${extraWork.status}`
    );
  }

  extraWork.status = ExtraWorkStatus.ACCEPTED;

  if (
    paymentData.extraPay.status === PaymentStatus.HOLD ||
    PaymentStatus.REFUNDED ||
    PaymentStatus.PAID ||
    PaymentStatus.CANCELLED
  ) {
    throw new AppError(
      status.BAD_REQUEST,
      `Payment for this extra work status is: ${paymentData.extraPay.status}`
    );
  }

  const paymentIntent = await StripeService.createPaymentIntent(
    extraWork.bidId.toString(),
    extraWork.reqServiceId.toString(),
    true
  );

  paymentData.extraPay.status = PaymentStatus.UNPAID;
  paymentData.extraPay.extraWorkId = extraWork._id;

  if (paymentIntent && paymentIntent.client_secret) {
    await paymentData.save();

    await extraWork.save();

    return { client_secret: paymentIntent.client_secret };
  } else {
    throw new AppError(status.BAD_REQUEST, "failed to get client secret.");
  }
};

export const ExtraWorkService = {
  reqForExtraWork,
  acceptReqForExtrawork,
  rejectReqForExtrawork,
};
