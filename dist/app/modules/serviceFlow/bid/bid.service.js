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
exports.BidService = void 0;
const userProfile_model_1 = require("./../../users/userProfile/userProfile.model");
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = __importDefault(require("../../../errors/AppError"));
const bid_interface_1 = require("./bid.interface");
const service_interface_1 = require("../service/service.interface");
const service_model_1 = require("../service/service.model");
const socket_1 = require("../../../socket/socket");
const mechanicProfile_model_1 = require("../../users/mechanicProfile/mechanicProfile.model");
const bid_model_1 = require("./bid.model");
const mongoose_1 = __importDefault(require("mongoose"));
const stripe_1 = require("../../stripe/stripe");
// import Payment from "../../stripe/payment.model";
// import { PaymentStatus } from "../../stripe/payment.interface";
//import { MechanicProfile } from "../../users/mechanicProfile/mechanicProfile.model";
const addBid = (bidData, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const isServiceExist = yield service_model_1.Service.findOne({
        _id: bidData.reqServiceId,
        status: service_interface_1.Status.FINDING,
    });
    ///-----------------
    // const isAnyRunning = await Payment.findOne({
    //   mechanicId: userId,
    //   status: PaymentStatus.UNPAID,
    // }).lean();
    // if (isAnyRunning && isAnyRunning?._id) {
    //   throw new AppError(status.BAD_REQUEST, "Your current service not done.");
    // }
    ///-----------------
    const mechaniceProfile = yield mechanicProfile_model_1.MechanicProfile.findOne({ user: userId });
    if (!mechaniceProfile) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Profile not found.");
    }
    if (mechaniceProfile.isNeedToPayForWorkShop) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Another mechanics with workshop open account before you near your location. So you have to pay for one time.After pay you can bid.");
    }
    if (!isServiceExist) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Service req not found");
    }
    const findBid = yield bid_model_1.Bid.findOne({
        mechanicId: userId,
        reqServiceId: bidData.reqServiceId,
    });
    if ((findBid === null || findBid === void 0 ? void 0 : findBid.status) === bid_interface_1.BidStatus.declined) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "You already declined.");
    }
    if ((findBid === null || findBid === void 0 ? void 0 : findBid.status) === bid_interface_1.BidStatus.provided) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "You already add bid.");
    }
    if (mechaniceProfile === null || mechaniceProfile === void 0 ? void 0 : mechaniceProfile.stripeAccountId) {
        const account = yield stripe_1.stripe.accounts.retrieve(mechaniceProfile === null || mechaniceProfile === void 0 ? void 0 : mechaniceProfile.stripeAccountId);
        const canReceivePayments = account.charges_enabled && account.payouts_enabled;
        if (!canReceivePayments) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Stripe account not configured correctly. Try again to connect & verify.");
        }
    }
    if (!(mechaniceProfile === null || mechaniceProfile === void 0 ? void 0 : mechaniceProfile.stripeAccountId)) {
        throw new AppError_1.default(500, "You have to add a stripe account from profile.");
    }
    const saveBid = yield bid_model_1.Bid.create({
        price: bidData.price,
        reqServiceId: bidData.reqServiceId,
        location: {
            placeId: bidData.placeId,
            coordinates: {
                type: "Point",
                coordinates: bidData.coordinates,
            },
        },
        mechanicId: userId,
        status: bid_interface_1.BidStatus.provided,
        extraWork: {
            price: 0,
            description: "",
            issue: "",
        },
    });
    const io = (0, socket_1.getSocket)();
    const userProfile = yield userProfile_model_1.UserProfile.findOne({ user: isServiceExist.user });
    const bidWithUserProfile = Object.assign(Object.assign({}, saveBid.toObject()), { // converts Mongoose doc to plain object
        userProfile });
    io.emit(`service-${saveBid.reqServiceId}`, {
        serviceId: saveBid.reqServiceId,
    });
    return bidWithUserProfile;
});
const declinedBid = (bidData, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const isServiceExist = yield service_model_1.Service.findOne({
        _id: bidData.reqServiceId,
        status: service_interface_1.Status.FINDING,
    });
    if (!isServiceExist) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Service req not found");
    }
    const findBid = yield bid_model_1.Bid.findOne({
        mechanicId: userId,
        reqServiceId: bidData.reqServiceId,
    });
    if ((findBid === null || findBid === void 0 ? void 0 : findBid.status) === bid_interface_1.BidStatus.declined) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "You already declined.");
    }
    if ((findBid === null || findBid === void 0 ? void 0 : findBid.status) === bid_interface_1.BidStatus.provided) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "You already add bid.");
    }
    const service = yield bid_model_1.Bid.create(Object.assign(Object.assign({}, bidData), { price: 0, mechanicId: userId, status: bid_interface_1.BidStatus.declined, extraWork: {
            price: 0,
            description: "",
            issue: "",
        } }));
    return service;
});
const bidHistory = (mechanicId) => __awaiter(void 0, void 0, void 0, function* () {
    const mechanicObjectId = new mongoose_1.default.Types.ObjectId(mechanicId);
    const bids = yield bid_model_1.Bid.aggregate([
        // Filter bids for this mechanic
        { $match: { mechanicId: mechanicObjectId } },
        // Exclude declined bids
        { $match: { status: { $ne: "declined" } } },
        // Lookup corresponding payments
        {
            $lookup: {
                from: "payments",
                let: { bidId: "$_id", serviceId: "$reqServiceId" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$serviceId", "$$serviceId"] },
                                    { $eq: ["$mechanicId", mechanicObjectId] },
                                ],
                            },
                        },
                    },
                ],
                as: "payments",
            },
        },
        // Lookup the service for this bid
        {
            $lookup: {
                from: "services",
                localField: "reqServiceId",
                foreignField: "_id",
                as: "service",
            },
        },
        { $unwind: "$service" },
        // Lookup user profile of the service requester
        {
            $lookup: {
                from: "userprofiles",
                localField: "service.user",
                foreignField: "user",
                as: "userProfile",
            },
        },
        { $unwind: { path: "$userProfile", preserveNullAndEmptyArrays: true } },
        // Add customerStatus based on payments
        {
            $addFields: {
                customerStatus: {
                    $cond: [
                        { $eq: [{ $size: "$payments" }, 0] },
                        "pending",
                        {
                            $cond: [
                                {
                                    $anyElementTrue: {
                                        $map: {
                                            input: "$payments",
                                            as: "p",
                                            in: { $eq: ["$$p.bidId", "$_id"] },
                                        },
                                    },
                                },
                                "accepted",
                                "rejected",
                            ],
                        },
                    ],
                },
            },
        },
        // Sort latest bids first
        { $sort: { createdAt: -1 } },
    ]);
    const formattedBids = bids.map((bid) => {
        var _a, _b, _c, _d;
        return ({
            _id: bid._id,
            price: bid.price,
            reqServiceId: bid.reqServiceId,
            mechanicId: bid.mechanicId,
            status: bid.status,
            customerStatus: bid.customerStatus,
            service: {
                _id: bid.service._id,
                issue: bid.service.issue,
                description: bid.service.description,
            },
            userProfile: {
                _id: ((_a = bid.userProfile) === null || _a === void 0 ? void 0 : _a._id) || null,
                fullName: ((_b = bid.userProfile) === null || _b === void 0 ? void 0 : _b.fullName) || "",
                email: ((_c = bid.userProfile) === null || _c === void 0 ? void 0 : _c.email) || "",
                image: ((_d = bid.userProfile) === null || _d === void 0 ? void 0 : _d.image) || "",
            },
        });
    });
    return formattedBids;
});
exports.BidService = {
    addBid,
    declinedBid,
    bidHistory,
};
