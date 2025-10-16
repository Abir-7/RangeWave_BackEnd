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
exports.StripeService = void 0;
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const mechanicProfile_model_1 = require("../users/mechanicProfile/mechanicProfile.model");
const stripe_1 = require("./stripe");
const config_1 = require("../../config");
const payment_model_1 = __importDefault(require("./payment.model"));
const payment_interface_1 = require("./payment.interface");
const logger_1 = __importDefault(require("../../utils/logger"));
const user_model_1 = __importDefault(require("../users/user/user.model"));
const userProfile_model_1 = require("../users/userProfile/userProfile.model");
const service_model_1 = require("../serviceFlow/service/service.model");
const service_interface_1 = require("../serviceFlow/service/service.interface");
const mongoose_1 = __importDefault(require("mongoose"));
const socket_1 = require("../../socket/socket");
const createAndConnect = (mechanicEmail) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mechanicEmail || !mechanicEmail.includes("@")) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Invalid email address");
    }
    // Step 1: Fetch mechanic profile
    const mechanicProfile = yield mechanicProfile_model_1.MechanicProfile.findOne({
        email: mechanicEmail,
    });
    if (!mechanicProfile) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Mechanic profile not found.");
    }
    let stripeAccountId;
    // Step 2: Check if Stripe account already exists
    if (mechanicProfile.stripeAccountId) {
        stripeAccountId = mechanicProfile.stripeAccountId;
    }
    else {
        // Step 3: Create new Stripe account if not found
        const account = yield stripe_1.stripe.accounts.create({
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
        mechanicProfile.stripeAccountId = account.id;
        yield mechanicProfile.save();
    }
    // Step 5: Create onboarding link
    const accountLink = yield stripe_1.stripe.accountLinks.create({
        account: stripeAccountId,
        refresh_url: `${config_1.appConfig.server.base_url}/stripe/onboarding/refresh`,
        return_url: `${config_1.appConfig.server.base_url}/stripe/onboarding/success`,
        type: "account_onboarding",
        collect: "eventually_due", // optional: ensures missing info is collected
    });
    // if (!account.charges_enabled || !account.payouts_enabled) {
    //   isAccountActive = false;
    // } else {
    //   isAccountActive = true;
    // }
    return {
        url: accountLink.url,
        accountId: stripeAccountId,
        isAccountActive: mechanicProfile.isStripeActive,
    };
});
const createPaymentIntent = (pId) => __awaiter(void 0, void 0, void 0, function* () {
    const paymentData = yield payment_model_1.default.findOne({
        _id: pId,
        status: payment_interface_1.PaymentStatus.UNPAID,
    });
    if (!paymentData) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Payment data not found.");
    }
    const totalCost = ((paymentData === null || paymentData === void 0 ? void 0 : paymentData.amount) || 0) + ((paymentData === null || paymentData === void 0 ? void 0 : paymentData.extraAmount) || 0);
    if (totalCost === 0) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Total amount can't be zero.");
    }
    const mechanicData = yield mechanicProfile_model_1.MechanicProfile.findOne({
        user: paymentData.mechanicId,
    });
    if (!mechanicData) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Mechanic profile not found.");
    }
    if (!mechanicData.stripeAccountId) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Mechanic have to create and connect stripe account with app from profile section.");
    }
    // If already created, return client_secret if still pending
    if (paymentData.txId) {
        const existingIntent = yield stripe_1.stripe.paymentIntents.retrieve(paymentData.txId);
        if ([
            "requires_payment_method",
            "requires_confirmation",
            "requires_action",
            "processing",
        ].includes(existingIntent.status)) {
            return {
                paymentIntent: existingIntent.client_secret,
            };
        }
    }
    // --- Begin Internal PaymentIntent Creation Logic ---
    const user = yield user_model_1.default.findById(paymentData.user);
    if (!user)
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found.");
    const userProfile = yield userProfile_model_1.UserProfile.findOne({ user: user._id });
    if (!userProfile)
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User profile not found.");
    let stripeCustomerId = userProfile.stripeCustomerId;
    if (!stripeCustomerId) {
        const customer = yield stripe_1.stripe.customers.create({
            email: user.email,
            metadata: { userId: String(user._id) },
        });
        stripeCustomerId = customer.id;
        userProfile.stripeCustomerId = stripeCustomerId;
        yield userProfile.save();
    }
    const connectedAccount = yield stripe_1.stripe.accounts.retrieve(mechanicData.stripeAccountId);
    if (!connectedAccount || connectedAccount.deleted) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Invalid connected account.");
    }
    let newPaymentIntent;
    try {
        newPaymentIntent = yield stripe_1.stripe.paymentIntents.create({
            amount: Math.round(totalCost * 100),
            currency: "usd",
            customer: stripeCustomerId,
            automatic_payment_methods: { enabled: true },
            transfer_data: {
                destination: mechanicData.stripeAccountId,
            },
            metadata: {
                bidId: String(paymentData.bidId),
                serviceId: String(paymentData.serviceId),
                userId: String(paymentData.user),
                mechanicId: String(paymentData.mechanicId),
                paymentId: pId,
            },
        });
    }
    catch (error) {
        throw new Error("The mechanic hasn’t finished payment setup. You can wait for verification or choose offline.");
    }
    yield payment_model_1.default.findByIdAndUpdate(pId, {
        txId: newPaymentIntent.id,
        paymentType: payment_interface_1.PaymentType.ONLINE,
    });
    console.log(newPaymentIntent, "intent");
    return {
        paymentIntent: newPaymentIntent.client_secret,
    };
});
const zoneExclusivePayment = (mechanicId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const totalCost = 10; // USD
        const paymentIntent = yield stripe_1.stripe.paymentIntents.create({
            amount: Math.round(totalCost * 100), // Stripe expects cents
            currency: "usd",
            automatic_payment_methods: { enabled: true },
            metadata: { mechanicId }, // attach mechanic info
        });
        return {
            clientSecret: paymentIntent.client_secret, // send to frontend
            paymentIntentId: paymentIntent.id,
        };
    }
    catch (error) {
        logger_1.default.error("Stripe PaymentIntent error:", error);
        throw new Error("Payment initialization failed");
    }
});
const stripeWebhook = (rawBody, sig) => __awaiter(void 0, void 0, void 0, function* () {
    let event;
    try {
        event = stripe_1.stripe.webhooks.constructEvent(rawBody, sig, config_1.appConfig.stripe.webhook);
    }
    catch (err) {
        logger_1.default.error(`Webhook signature verification failed:${err}`);
        throw new Error("Webhook signature verification failed.");
    }
    logger_1.default.info(event.type);
    switch (event.type) {
        case "payment_intent.succeeded": {
            const session = yield mongoose_1.default.startSession();
            session.startTransaction();
            try {
                const paymentIntent = event.data.object;
                const metadata = paymentIntent.metadata;
                const { bidId, serviceId, paymentId, mechanicId } = metadata;
                if (bidId && serviceId && paymentId) {
                    const serviceData = yield service_model_1.Service.findOne({
                        _id: serviceId,
                        bidId,
                    }).session(session);
                    if (!serviceData) {
                        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Service data not found.");
                    }
                    serviceData.isServiceCompleted = service_interface_1.IsServiceCompleted.YES;
                    yield Promise.all([
                        payment_model_1.default.findByIdAndUpdate(paymentId, {
                            status: payment_interface_1.PaymentStatus.PAID,
                        }).session(session),
                        serviceData.save({ session }),
                    ]);
                    yield session.commitTransaction();
                    session.endSession();
                }
                if (mechanicId) {
                    //!
                    const mechanicData = yield mechanicProfile_model_1.MechanicProfile.findOne({
                        user: mechanicId,
                    });
                    if (!mechanicData) {
                        throw new AppError_1.default(404, "Mechanic data not found.");
                    }
                    mechanicData.isNeedToPayForWorkShop = false;
                    yield mechanicData.save();
                }
                //--------------------------------- socket need----------------------------
                const io = (0, socket_1.getSocket)();
                io.emit(`progress-${paymentId}`, {
                    paymentId: paymentId,
                });
                io === null || io === void 0 ? void 0 : io.emit(`user-${mechanicId}`, {
                    message: "Customer mark service as done.",
                    paymentId: paymentId,
                });
            }
            catch (err) {
                yield session.abortTransaction();
                session.endSession();
                throw err;
            }
            break;
        }
        case "account.updated": {
            console.log("hit");
            const account = event.data.object; // Stripe.Account
            const stripeAccountId = account.id; // e.g. acct_1QWxyzABC
            // Find mechanic by their connected Stripe account
            const mechanicProfile = yield mechanicProfile_model_1.MechanicProfile.findOne({
                stripeAccountId,
            });
            // Check if their account is fully active
            if (account.charges_enabled && account.payouts_enabled) {
                if (mechanicProfile) {
                    mechanicProfile.isStripeActive = true;
                    yield mechanicProfile.save();
                }
            }
            else {
                // Optional: handle case where account becomes inactive
                if (mechanicProfile) {
                    mechanicProfile.isStripeActive = false;
                    yield mechanicProfile.save();
                }
            }
            break;
        }
        case "payment_intent.payment_failed":
        case "payment_intent.canceled": {
            break;
        }
        default:
            logger_1.default.info(`Unhandled event type: ${event.type}`);
    }
});
const getExpressDashboardLink = (mechanic_id) => __awaiter(void 0, void 0, void 0, function* () {
    const profile = yield mechanicProfile_model_1.MechanicProfile.findOne({ user: mechanic_id }).lean();
    console.log(profile);
    const mechanicStripeAccountId = profile === null || profile === void 0 ? void 0 : profile.stripeAccountId;
    if (!mechanicStripeAccountId) {
        throw new Error("You have no stripe account linked");
    }
    //await stripe.accounts.del(mechanicStripeAccountId);
    // Create a login link
    try {
        const loginLink = yield stripe_1.stripe.accounts.createLoginLink(mechanicStripeAccountId);
        return loginLink.url;
    }
    catch (error) {
        throw new Error("Stripe account not configured correctly. Try again to connect.");
    }
});
exports.StripeService = {
    createAndConnect,
    createPaymentIntent,
    zoneExclusivePayment,
    stripeWebhook,
    getExpressDashboardLink,
};
