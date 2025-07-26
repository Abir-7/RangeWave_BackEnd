import { ExtraWork } from "./extraWork.model";
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import status from "http-status";
import AppError from "../../../errors/AppError";
import { Service } from "../service/service.model";
import mongoose from "mongoose";
import { getSocket } from "../../../socket/socket";

import { Status } from "../service/service.interface";
import { ExtraWorkStatus } from "./extraWork.interface";

import { StripeService } from "../../stripe/stripe.service";
import Payment from "../../stripe/payment.model";
import { PaymentStatus } from "../../stripe/payment.interface";

const reqForExtraWork = async (
  idData: {
    sId: string;
    bId: string;
  },
  data: {
    price: number;
    issue: string;
    description: string;
  }
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const serviceData = await Service.findById(idData.sId).session(session);

    if (!serviceData) {
      throw new AppError(status.NOT_FOUND, "Service not found");
    }
    if (serviceData.extraWork) {
      throw new AppError(
        status.BAD_REQUEST,
        "Already requested for extra work"
      );
    }
    if (serviceData.status !== Status.WORKING) {
      throw new AppError(
        status.BAD_REQUEST,
        "You can req for extra work when service status is working."
      );
    }

    const extraWork = await ExtraWork.create(
      [{ ...data, reqServiceId: idData.sId, bidId: idData.bId }],
      {
        session,
      }
    );

    serviceData.extraWork = extraWork[0]._id;
    await serviceData.save({ session });

    const io = getSocket();
    // socket-emit
    io.emit("extra-work", { serviceId: idData.sId });

    await session.commitTransaction();
    session.endSession();

    return extraWork[0];
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

const rejectReqForExtrawork = async (pId: string) => {
  const paymentData = await Payment.findById(pId);

  if (!paymentData || !paymentData.serviceId) {
    throw new AppError(status.NOT_FOUND, "Payment data not found");
  }

  const serviceData = await Service.findById(paymentData.serviceId);

  if (!serviceData || !serviceData.extraWork) {
    throw new AppError(status.NOT_FOUND, "Service data not found");
  }

  const extraWork = await ExtraWork.findById(serviceData.extraWork);

  if (!extraWork) {
    throw new AppError(status.NOT_FOUND, "Extra work data not found");
  }

  if (extraWork.status !== ExtraWorkStatus.WAITING) {
    throw new AppError(
      status.NOT_FOUND,
      `Extra work status already is ${extraWork.status}`
    );
  }

  extraWork.status = ExtraWorkStatus.REJECTED;
  const io = getSocket();
  io.emit("extra-work-reject", { paymentId: pId });
  return await extraWork.save();
};

const acceptReqForExtrawork = async (pId: string) => {
  const paymentData = await Payment.findById(pId);

  if (!paymentData) {
    throw new AppError(status.NOT_FOUND, "Payment data not found");
  }

  const service = await Service.findById(paymentData.serviceId);

  if (!service) {
    throw new AppError(status.NOT_FOUND, "Service not found");
  }

  const extraWork = await ExtraWork.findById(service.extraWork);

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

  const paymentIntentData = {
    bidId: extraWork.bidId,
    isForExtraWork: true,
    bidPrice: extraWork.price,
    serviceId: extraWork.reqServiceId,
    userId: String(service.user),
  };

  const paymentIntent = await StripeService.createPaymentIntent(
    paymentIntentData
  );

  paymentData.extraPay.status = PaymentStatus.UNPAID;
  paymentData.extraPay.extraWorkId = extraWork._id;

  if (paymentIntent) {
    await paymentData.save();

    await extraWork.save();

    return { paymentIntent };
  } else {
    throw new AppError(status.BAD_REQUEST, "failed to get client secret.");
  }
};

export const ExtraWorkService = {
  reqForExtraWork,
  acceptReqForExtrawork,
  rejectReqForExtrawork,
};
