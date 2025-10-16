"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtraWorkService = void 0;
const extraWork_model_1 = require("./extraWork.model");
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = __importDefault(require("../../../errors/AppError"));
const service_model_1 = require("../service/service.model");
const mongoose_1 = __importDefault(require("mongoose"));
const socket_1 = require("../../../socket/socket");
const service_interface_1 = require("../service/service.interface");
const extraWork_interface_1 = require("./extraWork.interface");
const stripe_service_1 = require("../../stripe/stripe.service");
const payment_model_1 = __importDefault(require("../../stripe/payment.model"));
const payment_interface_1 = require("../../stripe/payment.interface");
const reqForExtraWork = (idData, data) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const serviceData = yield service_model_1.Service.findById(idData.sId).session(session);
        if (!serviceData) {
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Service not found");
        }
        if (serviceData.extraWork) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Already requested for extra work");
        }
        if (serviceData.status !== service_interface_1.Status.WORKING) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "You can req for extra work when service status is working.");
        }
        const extraWork = yield extraWork_model_1.ExtraWork.create([Object.assign(Object.assign({}, data), { reqServiceId: idData.sId, bidId: idData.bId })], {
            session,
        });
        serviceData.extraWork = extraWork[0]._id;
        yield serviceData.save({ session });
        const io = (0, socket_1.getSocket)();
        // socket-emit
        io.emit("extra-work", { serviceId: idData.sId });
        yield session.commitTransaction();
        session.endSession();
        return extraWork[0];
    }
    catch (err) {
        yield session.abortTransaction();
        session.endSession();
        throw err;
    }
});
const rejectReqForExtrawork = (pId) => __awaiter(void 0, void 0, void 0, function* () {
    const paymentData = yield payment_model_1.default.findById(pId);
    if (!paymentData || !paymentData.serviceId) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Payment data not found");
    }
    const serviceData = yield service_model_1.Service.findById(paymentData.serviceId);
    if (!serviceData || !serviceData.extraWork) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Service data not found");
    }
    const extraWork = yield extraWork_model_1.ExtraWork.findById(serviceData.extraWork);
    if (!extraWork) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Extra work data not found");
    }
    if (extraWork.status !== extraWork_interface_1.ExtraWorkStatus.WAITING) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, `Extra work status already is ${extraWork.status}`);
    }
    extraWork.status = extraWork_interface_1.ExtraWorkStatus.REJECTED;
    const io = (0, socket_1.getSocket)();
    io.emit("extra-work-reject", { paymentId: pId });
    return yield extraWork.save();
});
const acceptReqForExtrawork = (pId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const paymentData = yield payment_model_1.default.findById(pId);
    if (!paymentData) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Payment data not found");
    }
    const service = yield service_model_1.Service.findById(paymentData.serviceId);
    if (!service) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Service not found");
    }
    const extraWork = yield extraWork_model_1.ExtraWork.findById(service.extraWork);
    if (!extraWork) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Extra work request not found");
    }
    if (extraWork._id.toString() !== ((_a = service.extraWork) === null || _a === void 0 ? void 0 : _a.toString())) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Extra work request doesn't match the service");
    }
    if (!paymentData) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Main payment data in not found.");
    }
    if (paymentData && paymentData.status !== payment_interface_1.PaymentStatus.HOLD) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Extra work request can't accept.Main payment is not in hold status.");
    }
    if (extraWork.status !== extraWork_interface_1.ExtraWorkStatus.WAITING) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, `Extra work status already is ${extraWork.status}`);
    }
    extraWork.status = extraWork_interface_1.ExtraWorkStatus.ACCEPTED;
    if (paymentData.extraPay.status === payment_interface_1.PaymentStatus.HOLD ||
        payment_interface_1.PaymentStatus.REFUNDED ||
        payment_interface_1.PaymentStatus.PAID ||
        payment_interface_1.PaymentStatus.CANCELLED) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, `Payment for this extra work status is: ${paymentData.extraPay.status}`);
    }
    const paymentIntentData = {
        bidId: extraWork.bidId,
        isForExtraWork: true,
        bidPrice: extraWork.price,
        serviceId: extraWork.reqServiceId,
        userId: String(service.user),
    };
    const paymentIntent = yield stripe_service_1.StripeService.createPaymentIntent(Object.assign(Object.assign({}, paymentIntentData), { mechanicId: "" }));
    paymentData.extraPay.status = payment_interface_1.PaymentStatus.UNPAID;
    paymentData.extraPay.extraWorkId = extraWork._id;
    if (paymentIntent) {
        yield paymentData.save();
        yield extraWork.save();
        return { paymentIntent };
    }
    else {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "failed to get client secret.");
    }
});
exports.ExtraWorkService = {
    reqForExtraWork,
    acceptReqForExtrawork,
    rejectReqForExtrawork,
};
