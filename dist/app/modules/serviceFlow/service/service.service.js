"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.ServiceService = exports.getMechanicRatings = void 0;
const room_service_1 = require("./../../chat/room/room.service");
/* eslint-disable arrow-body-style */
const http_status_1 = require("http-status");
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
const mongoose_1 = __importStar(require("mongoose"));
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
const service_model_1 = require("./service.model");
const service_interface_1 = require("./service.interface");
const stripe_service_1 = require("../../stripe/stripe.service");
const user_model_1 = __importDefault(require("../../users/user/user.model"));
const AppError_1 = __importDefault(require("../../../errors/AppError"));
const socket_1 = require("../../../socket/socket");
const payment_model_1 = __importDefault(require("../../stripe/payment.model"));
const payment_interface_1 = require("../../stripe/payment.interface");
const mechanicProfile_model_1 = require("../../users/mechanicProfile/mechanicProfile.model");
const bid_interface_1 = require("../bid/bid.interface");
const bid_model_1 = require("../bid/bid.model");
const room_model_1 = __importDefault(require("../../chat/room/room.model"));
const carIssuse_model_1 = require("../../carIssue/carIssuse.model");
const logger_1 = __importDefault(require("../../../utils/logger"));
const userRating_model_1 = __importDefault(require("../../rating/userRating/userRating.model"));
const mechanicRating_model_1 = __importDefault(require("../../rating/mechanicRating/mechanicRating.model"));
//------------------------for users--------------------------//
// const addServiceReq = async (
//   serviceData: {
//     issue: string;
//     isNew: boolean;
//     description: string;
//     location: {
//       placeId: string;
//       coordinates: number[];
//     };
//     schedule?: {
//       date: Date;
//     };
//   },
//   userId: string
// ): Promise<IService> => {
//   const location = {
//     placeId: serviceData.location.placeId,
//     coordinates: {
//       type: "Point",
//       coordinates: serviceData.location.coordinates,
//     },
//   };
//   const today = new Date();
//   // Set time range for today (start and end)
//   const startOfDay = new Date(today.setHours(0, 0, 0, 0));
//   const endOfDay = new Date(today.setHours(23, 59, 59, 999));
//   const isScheduled = !!serviceData.schedule?.date;
//   // 1. If this is a scheduled request, check if there's already a scheduled service today
//   // if (isScheduled) {
//   //   const existingScheduled = await Service.findOne({
//   //     user: userId,
//   //     status: { $in: [Status.FINDING, Status.WORKING, Status.WAITING] },
//   //     "schedule.isSchedule": true,
//   //     createdAt: { $gte: startOfDay, $lte: endOfDay },
//   //   });
//   //   if (existingScheduled) {
//   //     throw new Error("You already have a scheduled service request today.");
//   //   }
//   // }
//   // // 2. If this is an unscheduled request, check if there's already an unscheduled service today
//   // else {
//   //   const existingUnscheduled = await Service.findOne({
//   //     user: userId,
//   //     status: { $in: [Status.FINDING, Status.WORKING, Status.WAITING] },
//   //     "schedule.isSchedule": false,
//   //     createdAt: { $gte: startOfDay, $lte: endOfDay },
//   //   });
//   //   if (existingUnscheduled) {
//   //     throw new Error("You already have an unscheduled service request today.");
//   //   }
//   // }
//   // If no conflict, create the new service
//   const service = await Service.create({
//     issue: serviceData.issue,
//     description: serviceData.description,
//     user: userId,
//     location,
//     ...(isScheduled
//       ? {
//           schedule: {
//             isSchedule: true,
//             date: serviceData.schedule!.date,
//           },
//         }
//       : {
//           // For unscheduled, rely on default: { isSchedule: false, date: null }
//         }),
//   });
//   if (serviceData.isNew) {
//     await UserCarIssue.create({ name: serviceData.issue, user: userId });
//   }
//   const io = getSocket();
//   // socket-emit
//   io.emit("new-service", { serviceId: service._id });
//   return service;
// };
const addServiceReq = (serviceData, userId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log(userId);
    const location = {
        placeId: serviceData.location.placeId,
        coordinates: {
            type: "Point",
            coordinates: serviceData.location.coordinates,
        },
    };
    const today = new Date();
    // Set time range for today (start and end)
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    const isScheduled = !!((_a = serviceData.schedule) === null || _a === void 0 ? void 0 : _a.date);
    // 1. If this is a scheduled request, check if there's already a scheduled service today
    // if (isScheduled) {
    //   const existingScheduled = await Service.findOne({
    //     user: userId,
    //     status: { $in: [Status.FINDING, Status.WORKING, Status.WAITING] },
    //     "schedule.isSchedule": true,
    //     createdAt: { $gte: startOfDay, $lte: endOfDay },
    //   });
    //   if (existingScheduled) {
    //     throw new Error("You already have a scheduled service request today.");
    //   }
    // }
    // // 2. If this is an unscheduled request, check if there's already an unscheduled service today
    // else {
    //   const existingUnscheduled = await Service.findOne({
    //     user: userId,
    //     status: { $in: [Status.FINDING, Status.WORKING, Status.WAITING] },
    //     "schedule.isSchedule": false,
    //     createdAt: { $gte: startOfDay, $lte: endOfDay },
    //   });
    //   if (existingUnscheduled) {
    //     throw new Error("You already have an unscheduled service request today.");
    //   }
    // }
    // If no conflict, create the new service
    const session = yield mongoose_1.default.startSession();
    let service;
    try {
        yield session.withTransaction(() => __awaiter(void 0, void 0, void 0, function* () {
            service = yield service_model_1.Service.create([
                Object.assign({ issue: serviceData.issue, description: serviceData.description, user: userId, location }, (isScheduled
                    ? {
                        schedule: {
                            isSchedule: true,
                            date: serviceData.schedule.date,
                        },
                    }
                    : {
                    // For unscheduled, rely on default: { isSchedule: false, date: null }
                    })),
            ], { session });
            if (serviceData.isNew) {
                yield carIssuse_model_1.UserCarIssue.create([{ name: serviceData.issue, user: userId }], {
                    session,
                });
            }
        }));
        const io = (0, socket_1.getSocket)();
        // socket-emit
        if (service && service[0]) {
            io.emit("new-service", { serviceId: service[0]._id });
        }
        return service[0];
    }
    catch (error) {
        logger_1.default.error("❌ Error creating service:", error);
        throw error;
    }
    finally {
        yield session.endSession();
    }
});
const checkServiceStatusFinding = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const services = yield service_model_1.Service.find({
        user: userId,
        status: service_interface_1.Status.FINDING,
    }).sort({ createdAt: -1 });
    const immediateService = services.filter((s) => { var _a; return !((_a = s.schedule) === null || _a === void 0 ? void 0 : _a.isSchedule); });
    const scheduledService = services.filter((s) => { var _a; return (_a = s.schedule) === null || _a === void 0 ? void 0 : _a.isSchedule; });
    return { immediateService, scheduledService };
});
const getBidListOfService = (serviceId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const service = yield service_model_1.Service.findOne({
        _id: serviceId,
        user: userId,
    }).lean();
    if (!service) {
        throw new AppError_1.default(http_status_1.status.NOT_FOUND, " Service not found.");
    }
    if (service && service.status !== service_interface_1.Status.FINDING) {
        throw new AppError_1.default(http_status_1.status.BAD_REQUEST, `Service is already in  ${service.status}  `);
    }
    if (!((_a = service.location) === null || _a === void 0 ? void 0 : _a.coordinates)) {
        throw new AppError_1.default(http_status_1.status.BAD_REQUEST, " missing location");
    }
    const bids = yield bid_model_1.Bid.aggregate([
        { $match: { reqServiceId: service._id } },
        {
            $lookup: {
                from: "services",
                localField: "reqServiceId",
                foreignField: "_id",
                as: "service",
            },
        },
        { $unwind: "$service" },
        // Step 1: Join Mechanic Profile
        {
            $lookup: {
                from: "mechanicprofiles",
                localField: "mechanicId",
                foreignField: "user",
                as: "mechanicProfile",
            },
        },
        { $unwind: "$mechanicProfile" },
        // Step 2: Join Mechanic Ratings (all ratings of that mechanic)
        {
            $lookup: {
                from: "mechanicratings",
                localField: "mechanicId",
                foreignField: "mechanicId",
                as: "ratingDocs",
            },
        },
        // Step 3: Calculate average rating and count
        {
            $addFields: {
                averageRating: {
                    $cond: [
                        { $gt: [{ $size: "$ratingDocs" }, 0] },
                        {
                            $avg: "$ratingDocs.rating",
                        },
                        0,
                    ],
                },
                totalReviews: { $size: "$ratingDocs" },
            },
        },
        // Step 4: Project only needed fields
        {
            $project: {
                "service.schedule": 1,
                "service._id": 1,
                price: 1,
                status: 1,
                mechanicId: 1,
                averageRating: { $round: ["$averageRating", 1] },
                totalReviews: 1,
                location: 1,
                "mechanicProfile.fullName": 1,
                "mechanicProfile.image": 1,
                "mechanicProfile.email": 1,
                "mechanicProfile.workshop.name": 1,
                "mechanicProfile.workshop.location.placeId": 1,
                "mechanicProfile.workshop.location.coordinates": "$mechanicProfile.workshop.location.coordinates.coordinates",
            },
        },
    ]);
    // Step 5: Add distance in Node.js (still more efficient this way)
    return bids.map((bid) => {
        var _a, _b, _c;
        // const coords = bid.location?.coordinates?.coordinates;
        const coords = (_c = (_b = (_a = bid.mechanicProfile) === null || _a === void 0 ? void 0 : _a.workshop) === null || _b === void 0 ? void 0 : _b.location) === null || _c === void 0 ? void 0 : _c.coordinates;
        const distance = (coords === null || coords === void 0 ? void 0 : coords.length) > 1
            ? calculateDistance(service.location.coordinates.coordinates, coords)
            : null;
        return Object.assign(Object.assign({}, bid), { distance: distance || distance === 0 ? parseFloat(distance.toFixed(2)) : null });
    });
});
const hireMechanic = (data, userId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log(data.bidId, "ssdasd");
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const bidData = yield bid_model_1.Bid.findOne({
            _id: data.bidId,
            status: bid_interface_1.BidStatus.provided,
        }).session(session);
        if (!bidData) {
            throw new AppError_1.default(http_status_1.status.NOT_FOUND, "Bid data not found");
        }
        const isServiceExist = yield service_model_1.Service.findOne({
            _id: bidData.reqServiceId,
            user: userId,
        }).session(session);
        if (!isServiceExist) {
            throw new AppError_1.default(http_status_1.status.NOT_FOUND, "Service not found.");
        }
        if (isServiceExist.status === service_interface_1.Status.WAITING ||
            isServiceExist.status === service_interface_1.Status.COMPLETED ||
            isServiceExist.status === service_interface_1.Status.CANCELLED ||
            isServiceExist.status === service_interface_1.Status.WORKING) {
            throw new AppError_1.default(http_status_1.status.BAD_REQUEST, `Service status is ${isServiceExist.status}`);
        }
        const userMechanic = yield mechanicProfile_model_1.MechanicProfile.findOne({
            user: bidData.mechanicId,
        }).session(session);
        if (!userMechanic) {
            throw new AppError_1.default(http_status_1.status.NOT_FOUND, "Mechanic profile not found.");
        }
        const extraPrice = ((_a = bidData.extraWork) === null || _a === void 0 ? void 0 : _a.price) || 0;
        const totalPrice = Number(bidData.price) + Number(extraPrice);
        const payment = yield payment_model_1.default.create([
            {
                amount: totalPrice,
                bidId: bidData._id,
                serviceId: isServiceExist._id,
                mechanicId: bidData.mechanicId,
                status: payment_interface_1.PaymentStatus.UNPAID,
                user: isServiceExist.user,
            },
        ], { session });
        isServiceExist.bidId = bidData._id;
        isServiceExist.status = service_interface_1.Status.WAITING;
        yield isServiceExist.save({ session });
        yield (0, room_service_1.createRoomAfterHire)([bidData.mechanicId.toString(), isServiceExist.user.toString()], session);
        yield session.commitTransaction();
        session.endSession();
        //! Socket need------------------------------------------------
        const io = (0, socket_1.getSocket)();
        io.emit(`hire-${bidData.mechanicId}`, {
            serviceId: isServiceExist._id,
            paymentId: payment[0]._id,
        });
        io === null || io === void 0 ? void 0 : io.emit(`user-${bidData.mechanicId}`, {
            message: "You have been hired.",
            paymentId: payment[0]._id,
        });
        return payment[0]; // create returns an array
    }
    catch (err) {
        yield session.abortTransaction();
        session.endSession();
        throw new Error(err);
    }
});
const markServiceAsComplete = (pId, paymentType) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(paymentType);
    if (paymentType !== payment_interface_1.PaymentType.OFFLINE &&
        paymentType !== payment_interface_1.PaymentType.ONLINE) {
        throw new AppError_1.default(http_status_1.status.BAD_REQUEST, "Invalid payment  option.");
    }
    if (paymentType === payment_interface_1.PaymentType.OFFLINE) {
        const session = yield mongoose_1.default.startSession();
        session.startTransaction();
        try {
            const paymentData = yield payment_model_1.default.findOne({ _id: pId }).session(session);
            if (!paymentData) {
                throw new AppError_1.default(http_status_1.status.NOT_FOUND, "Payment data not found.");
            }
            paymentData.paymentType = payment_interface_1.PaymentType.OFFLINE;
            paymentData.status = payment_interface_1.PaymentStatus.PAID;
            const serviceData = yield service_model_1.Service.findOne({
                _id: paymentData.serviceId,
            }).session(session);
            if (!serviceData) {
                throw new AppError_1.default(http_status_1.status.NOT_FOUND, "Service data not found.");
            }
            serviceData.isServiceCompleted = service_interface_1.IsServiceCompleted.YES;
            yield Promise.all([
                paymentData.save({ session }),
                serviceData.save({ session }),
            ]);
            yield session.commitTransaction();
            session.endSession();
            //-----------------------------------socket------------------
            const io = (0, socket_1.getSocket)();
            io.emit(`progress-${paymentData._id}`, {
                paymentId: paymentData._id,
            });
            io === null || io === void 0 ? void 0 : io.emit(`user-${paymentData.mechanicId}`, {
                message: "Customer mark service as done.",
                paymentId: pId,
            });
            return {
                paymentIntent: "",
                message: "Work mark as comleted.",
                paymentType,
            };
        }
        catch (error) {
            yield session.abortTransaction();
            session.endSession();
            throw error;
        }
    }
    //----------------------------------------------------
    if (paymentType === payment_interface_1.PaymentType.ONLINE) {
        const result = yield stripe_service_1.StripeService.createPaymentIntent(pId);
        return {
            paymentIntent: result.paymentIntent,
            message: "PaymentIntent Created",
            paymentType,
        };
    }
});
const mechanicDetails = (m_id) => __awaiter(void 0, void 0, void 0, function* () {
    const mechanic = yield mechanicProfile_model_1.MechanicProfile.findOne({ user: m_id })
        .select("-createdAt -updatedAt -isNeedToPayForWorkShop")
        .populate("user", "email role")
        .lean();
    const result = yield mechanicRating_model_1.default.aggregate([
        {
            $match: { mechanicId: new mongoose_1.default.Types.ObjectId(m_id) },
        },
        {
            $group: {
                _id: "$mechanicId",
                averageRating: { $avg: "$rating" },
                totalRatings: { $sum: 1 },
            },
        },
    ]);
    const totalServiceDone = yield payment_model_1.default.countDocuments({
        mechanicId: new mongoose_1.default.Types.ObjectId(m_id),
        status: payment_interface_1.PaymentStatus.PAID,
    });
    const data = result[0] || {
        averageRating: 0,
        totalRatings: 0,
    };
    return Object.assign(Object.assign(Object.assign({}, mechanic), data), { totalServiceDone });
});
const getMechanicRatings = (mechanicId) => __awaiter(void 0, void 0, void 0, function* () {
    const ratings = yield mechanicRating_model_1.default.aggregate([
        {
            $match: {
                mechanicId: new mongoose_1.default.Types.ObjectId(mechanicId),
            },
        },
        {
            $lookup: {
                from: "userprofiles", // must match the actual Mongo collection name
                localField: "user", // from MechanicRating
                foreignField: "user", // from UserProfile
                as: "userProfile",
            },
        },
        {
            $unwind: {
                path: "$userProfile",
                preserveNullAndEmptyArrays: true, // in case userProfile missing
            },
        },
        {
            $project: {
                _id: 0,
                rating: 1,
                text: 1,
                name: "$userProfile.fullName",
                createdAt: 1,
            },
        },
        {
            $sort: {
                createdAt: -1,
            }, // newest first
        },
    ]);
    console.log(ratings);
    console.log("object33");
    return ratings;
});
exports.getMechanicRatings = getMechanicRatings;
const getUserRatings = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const ratings = yield userRating_model_1.default.aggregate([
        {
            $match: {
                user: new mongoose_1.default.Types.ObjectId(userId),
            },
        },
        {
            $lookup: {
                from: "mechanicprofiles", // must match the actual Mongo collection name
                localField: "mechanicId", // from MechanicRating
                foreignField: "user", // from UserProfile
                as: "mechanicProfile",
            },
        },
        {
            $unwind: {
                path: "$mechanicProfile",
                preserveNullAndEmptyArrays: true, // in case userProfile missing
            },
        },
        {
            $project: {
                _id: 0,
                rating: 1,
                text: 1,
                name: "$mechanicProfile.fullName",
                createdAt: 1,
            },
        },
        {
            $sort: { createdAt: -1 }, // newest first
        },
    ]);
    console.log("object33");
    return ratings;
});
//-----------------------common----------------------------
const getRunningService = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const userData = yield user_model_1.default.findById(userId).lean();
    if (!userData) {
        throw new AppError_1.default(http_status_1.status.NOT_FOUND, "User not found.");
    }
    let filter = {};
    if (userData.role === "USER") {
        filter = { status: payment_interface_1.PaymentStatus.UNPAID, user: userId }; //
    }
    else if (userData.role === "MECHANIC") {
        filter = { status: payment_interface_1.PaymentStatus.UNPAID, mechanicId: userId };
    }
    else {
        throw new AppError_1.default(http_status_1.status.BAD_REQUEST, "Invalid user role.");
    }
    const payments = yield payment_model_1.default.find(filter)
        .populate({ path: "bidId", select: "price status extraWork location" })
        .populate({
        path: "serviceId",
        select: "description status isServiceCompleted issue schedule location updatedAt",
    })
        .populate({
        path: "userProfile",
        select: "-carInfo -createdAt -updatedAt -__v",
    })
        .populate({
        path: "mechanicProfile",
        select: "-workshop -experience -certificates -createdAt -updatedAt -__v",
    })
        .select("-id -__v  -updatedAt ")
        .sort({ updatedAt: -1 });
    if (!(payments === null || payments === void 0 ? void 0 : payments.length)) {
        return [];
    }
    return payments;
});
const cancelService = (pId, serviceData, userId, userRoleDAta) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession();
    console.log(pId, "ssss", userId);
    try {
        session.startTransaction();
        const paymentData = yield payment_model_1.default.findOne({
            _id: pId,
            status: payment_interface_1.PaymentStatus.UNPAID,
        });
        if (!paymentData) {
            throw new AppError_1.default(http_status_1.status.NOT_FOUND, "Payment data not found");
        }
        const service = yield service_model_1.Service.findByIdAndUpdate(paymentData === null || paymentData === void 0 ? void 0 : paymentData.serviceId, Object.assign(Object.assign({}, serviceData), { status: service_interface_1.Status.CANCELLED }), {
            new: true,
            session,
        });
        if (!service) {
            throw new Error("Service not found");
        }
        paymentData.status = payment_interface_1.PaymentStatus.CANCELLED;
        yield paymentData.save({ session });
        const isMechanic = userRoleDAta === "MECHANIC";
        const io = (0, socket_1.getSocket)();
        io.emit(`progress-${paymentData._id}`, { paymentId: pId });
        io === null || io === void 0 ? void 0 : io.emit(`user-${isMechanic ? paymentData.user : paymentData.mechanicId}`, {
            message: `${isMechanic
                ? "Mechanic cencel your service"
                : "Customer cencel his service"}`,
            paymentId: pId,
        });
        yield session.commitTransaction();
        session.endSession();
        return service;
    }
    catch (error) {
        // Rollback on error
        yield session.abortTransaction();
        session.endSession();
        throw error;
    }
});
const seeCurrentServiceProgress = (pId, userRoleData) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const serviceData = yield payment_model_1.default.findOne({ _id: pId })
        .populate({ path: "bidId", select: "price status extraWork location" })
        .populate({
        path: "serviceId",
        select: "description status isServiceCompleted issue schedule location",
    })
        .populate({
        path: "userProfile",
        select: "-carInfo -createdAt -updatedAt -__v",
    })
        .populate({
        path: "mechanicProfile",
        select: "-workshop -experience -certificates -createdAt -updatedAt -__v",
    })
        .select("-id -__v -createdAt -updatedAt")
        .lean();
    const chatRoom = yield room_model_1.default.findOne({
        users: { $all: [serviceData === null || serviceData === void 0 ? void 0 : serviceData.mechanicId._id, serviceData === null || serviceData === void 0 ? void 0 : serviceData.user._id] }, // both users must be in the array
    });
    if (!serviceData) {
        throw new AppError_1.default(http_status_1.status.NOT_FOUND, "No data found.");
    }
    let avgRating = 0;
    if (userRoleData === "MECHANIC") {
        const avgResult = yield userRating_model_1.default.aggregate([
            { $match: { user: new mongoose_1.default.Types.ObjectId(serviceData.user) } },
            { $group: { _id: null, averageRating: { $avg: "$rating" } } },
        ]);
        avgRating = ((_a = avgResult[0]) === null || _a === void 0 ? void 0 : _a.averageRating) || 0;
    }
    if (userRoleData === "USER") {
        const avgResult = yield mechanicRating_model_1.default.aggregate([
            {
                $match: {
                    mechanicId: new mongoose_1.default.Types.ObjectId(serviceData.mechanicId),
                },
            },
            { $group: { _id: null, averageRating: { $avg: "$rating" } } },
        ]);
        avgRating = ((_b = avgResult[0]) === null || _b === void 0 ? void 0 : _b.averageRating) || 0;
    }
    return Object.assign(Object.assign({}, serviceData), { chatId: (chatRoom === null || chatRoom === void 0 ? void 0 : chatRoom._id) || "", avgRating: Number(avgRating.toFixed(2)) });
});
//-------------------------------mechanic-------------------------------------------
// const getAllRequestedService = async (
//   mechanicId: string,
//   mechanicCoordinate: [number, number]
// ) => {
//   const aggregateArray: PipelineStage[] = [
//     // 1. Match services that are FINDING
//     {
//       $match: {
//         status: Status.FINDING,
//       },
//     },
//     // 2. Lookup bids for each service
//     {
//       $lookup: {
//         from: "bids",
//         let: { serviceId: "$_id" },
//         pipeline: [
//           {
//             $match: {
//               $expr: { $eq: ["$reqServiceId", "$$serviceId"] },
//             },
//           },
//         ],
//         as: "bids",
//       },
//     },
//     // 3. Remove services where this mechanic has only declined bids
//     {
//       $match: {
//         $expr: {
//           $or: [
//             // Mechanic has no bids for this service
//             {
//               $eq: [
//                 {
//                   $size: {
//                     $filter: {
//                       input: "$bids",
//                       as: "b",
//                       cond: {
//                         $eq: [
//                           "$$b.mechanicId",
//                           new mongoose.Types.ObjectId(mechanicId),
//                         ],
//                       },
//                     },
//                   },
//                 },
//                 0,
//               ],
//             },
//             // Mechanic has at least one non-declined bid
//             {
//               $gt: [
//                 {
//                   $size: {
//                     $filter: {
//                       input: "$bids",
//                       as: "b",
//                       cond: {
//                         $and: [
//                           {
//                             $eq: [
//                               "$$b.mechanicId",
//                               new mongoose.Types.ObjectId(mechanicId),
//                             ],
//                           },
//                           { $ne: ["$$b.status", BidStatus.declined] },
//                         ],
//                       },
//                     },
//                   },
//                 },
//                 0,
//               ],
//             },
//           ],
//         },
//       },
//     },
//     // 4. Lookup user profile
//     {
//       $lookup: {
//         from: "userprofiles",
//         localField: "user",
//         foreignField: "user",
//         as: "profileData",
//       },
//     },
//     // 5. Lookup user ratings
//     {
//       $lookup: {
//         from: "userratings",
//         let: { userId: { $arrayElemAt: ["$profileData.user", 0] } },
//         pipeline: [
//           {
//             $match: {
//               $expr: { $eq: ["$mechanicId", "$$userId"] },
//             },
//           },
//         ],
//         as: "userRatings",
//       },
//     },
//     // 6. Filter out declined bids and add calculated fields
//     {
//       $addFields: {
//         bids: {
//           $filter: {
//             input: "$bids",
//             as: "b",
//             cond: { $ne: ["$$b.status", BidStatus.declined] },
//           },
//         },
//         isBidDone: {
//           $gt: [
//             {
//               $size: {
//                 $filter: {
//                   input: "$bids",
//                   as: "b",
//                   cond: { $eq: ["$$b.status", BidStatus.provided] },
//                 },
//               },
//             },
//             0,
//           ],
//         },
//         location: {
//           placeId: "$location.placeId",
//           coordinates: "$location.coordinates.coordinates",
//         },
//         avgRating: { $ifNull: [{ $avg: "$userRatings.rating" }, 0] },
//       },
//     },
//     // 7. Project unnecessary fields
//     {
//       $project: {
//         "profileData.carInfo": 0,
//         "profileData.location": 0,
//         bids: 0,
//         userRatings: 0,
//       },
//     },
//   ];
//   const data = await Service.aggregate(aggregateArray);
//   // 8. Add distance calculation
//   const enriched = data.map((service: any) => {
//     const distance = calculateDistance(
//       mechanicCoordinate,
//       service.location.coordinates
//     );
//     return {
//       ...service,
//       distanceKm: distance,
//     };
//   });
//   return enriched;
// };
const getAllRequestedService = (mechanicId, mechanicCoordinate) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const aggregateArray = [
        { $match: { status: "FINDING" } },
        {
            $lookup: {
                from: "bids",
                localField: "_id",
                foreignField: "reqServiceId",
                as: "bids",
            },
        },
        // Lookup mechanic's own bid
        {
            $lookup: {
                from: "bids",
                let: { requestId: "$_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$reqServiceId", "$$requestId"] },
                                    {
                                        $eq: [
                                            "$mechanicId",
                                            new mongoose_1.default.Types.ObjectId(mechanicId),
                                        ],
                                    },
                                ],
                            },
                        },
                    },
                    { $limit: 1 },
                ],
                as: "mechanicBid",
            },
        },
        { $unwind: { path: "$mechanicBid", preserveNullAndEmptyArrays: true } },
        // Remove services where same mechanic declined
        {
            $match: {
                $or: [
                    { mechanicBid: { $exists: false } },
                    // { "mechanicBid.status": "provided" },
                ],
            },
        },
        // Lookup profile and ratings
        {
            $lookup: {
                from: "userprofiles",
                localField: "user",
                foreignField: "user",
                as: "profileData",
            },
        },
        {
            $lookup: {
                from: "userratings",
                let: { userId: { $arrayElemAt: ["$profileData.user", 0] } },
                pipeline: [{ $match: { $expr: { $eq: ["$user", "$$userId"] } } }],
                as: "userRatings",
            },
        },
        {
            $addFields: {
                price: { $ifNull: ["$mechanicBid.price", null] },
                isBidDone: {
                    $cond: [{ $eq: ["$mechanicBid.status", "provided"] }, true, false],
                },
                location: {
                    placeId: "$location.placeId",
                    coordinates: "$location.coordinates.coordinates",
                },
                avgRating: { $ifNull: [{ $avg: "$userRatings.rating" }, 0] },
            },
        },
        {
            $project: {
                "profileData.carInfo": 0,
                "profileData.location": 0,
                bids: 0,
                userRatings: 0,
                mechanicBid: 0,
            },
        },
        { $sort: { createdAt: -1 } },
    ];
    const mechanicData = yield mechanicProfile_model_1.MechanicProfile.findOne({ user: mechanicId });
    const data = yield service_model_1.Service.aggregate(aggregateArray);
    const workshopLocation = (_c = (_b = (_a = mechanicData === null || mechanicData === void 0 ? void 0 : mechanicData.workshop) === null || _a === void 0 ? void 0 : _a.location) === null || _b === void 0 ? void 0 : _b.coordinates) === null || _c === void 0 ? void 0 : _c.coordinates;
    // Add distance
    const enriched = data === null || data === void 0 ? void 0 : data.map((service) => (Object.assign(Object.assign({}, service), { distanceKm: (workshopLocation === null || workshopLocation === void 0 ? void 0 : workshopLocation.length) > 1
            ? calculateDistance(workshopLocation, service === null || service === void 0 ? void 0 : service.location.coordinates)
            : 0 })));
    return enriched;
});
const changeServiceStatus = (pId, statusData, extraWork) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const paymentData = yield payment_model_1.default.findById(pId).session(session);
        if (!paymentData) {
            throw new AppError_1.default(http_status_1.status.NOT_FOUND, "Payment data not found.");
        }
        const bidData = yield bid_model_1.Bid.findOne({ _id: paymentData.bidId }).session(session);
        if (!bidData) {
            throw new AppError_1.default(http_status_1.status.NOT_FOUND, "Bid data not found.");
        }
        const serviceData = yield service_model_1.Service.findById(bidData.reqServiceId).session(session);
        if (!serviceData) {
            throw new AppError_1.default(http_status_1.status.NOT_FOUND, "Service data not found.");
        }
        // Apply logic
        if (serviceData.status === service_interface_1.Status.WAITING &&
            statusData === service_interface_1.Status.WORKING) {
            if ((extraWork === null || extraWork === void 0 ? void 0 : extraWork.price) > 0) {
                bidData.extraWork = extraWork;
                paymentData.extraAmount = extraWork === null || extraWork === void 0 ? void 0 : extraWork.price;
            }
            serviceData.status = service_interface_1.Status.WORKING;
        }
        else if (serviceData.status === service_interface_1.Status.WORKING &&
            statusData === service_interface_1.Status.COMPLETED) {
            serviceData.status = service_interface_1.Status.COMPLETED;
            serviceData.isServiceCompleted = service_interface_1.IsServiceCompleted.WAITING;
        }
        else {
            throw new AppError_1.default(http_status_1.status.BAD_REQUEST, `Failed to change service status. Current status: ${serviceData.status}`);
        }
        // Save all within transaction
        yield bidData.save({ session });
        yield paymentData.save({ session });
        const newData = yield serviceData.save({ session });
        yield session.commitTransaction();
        session.endSession();
        const statusMessages = {
            [service_interface_1.Status.FINDING]: "Service is being searched...",
            [service_interface_1.Status.WAITING]: "Service is waiting for approval...",
            [service_interface_1.Status.WORKING]: "Service is in progress...",
            [service_interface_1.Status.COMPLETED]: "Service has been completed.",
            [service_interface_1.Status.CANCELLED]: "Service was cancelled.",
        };
        // Notify via socket outside transaction
        const io = (0, socket_1.getSocket)();
        io.emit(`progress-${paymentData._id}`, { paymentId: pId });
        io === null || io === void 0 ? void 0 : io.emit(`user-${paymentData.user}`, {
            message: statusMessages[statusData] || `Service status changed to ${statusData}`,
            paymentId: pId,
        });
        return newData;
    }
    catch (err) {
        yield session.abortTransaction();
        session.endSession();
        throw err;
    }
});
const seeServiceDetails = (sId) => __awaiter(void 0, void 0, void 0, function* () {
    const service = yield service_model_1.Service.aggregate([
        {
            $match: {
                _id: new mongoose_1.Types.ObjectId(sId),
            },
        },
        // Lookup for UserProfile
        {
            $lookup: {
                from: "userprofiles",
                localField: "user",
                foreignField: "user",
                as: "userProfile",
            },
        },
        { $unwind: { path: "$userProfile", preserveNullAndEmptyArrays: true } },
        // Lookup inside UserProfile → User
        {
            $lookup: {
                from: "users",
                localField: "userProfile.user",
                foreignField: "_id",
                as: "userProfile.user",
            },
        },
        {
            $unwind: { path: "$userProfile.user", preserveNullAndEmptyArrays: true },
        },
        // Project only required fields (✅ no mix of inclusion + exclusion)
        {
            $project: {
                issue: 1,
                description: 1,
                schedule: 1,
                //price: 1,
                "location.placeId": 1,
                "location.coordinates.coordinates": 1,
                "userProfile.fullName": 1,
                "userProfile.image": 1,
                // only keep the safe fields you want
                "userProfile.user._id": 1,
                "userProfile.user.email": 1,
                "userProfile.user.role": 1,
                "userProfile.carInfo": 1,
            },
        },
    ]);
    if (!service || (service === null || service === void 0 ? void 0 : service.length) === 0) {
        throw new Error("Service not found");
    }
    const result = service[0];
    let userRating;
    if (result && result.userProfile.user._id) {
        console.log(result.userProfile.user._id);
        const ratingData = yield userRating_model_1.default.aggregate([
            {
                $match: {
                    user: new mongoose_1.default.Types.ObjectId(String(result.userProfile.user._id)),
                },
            },
            {
                $group: {
                    _id: "$user",
                    averageRating: { $avg: "$rating" },
                    totalRatings: { $sum: 1 },
                },
            },
        ]);
        userRating = ratingData[0] || {
            averageRating: 0,
            totalRatings: 0,
        };
    }
    console.log(userRating);
    return Object.assign(Object.assign({}, result), { location: {
            placeId: result.location.placeId,
            coordinates: result.location.coordinates.coordinates,
        }, userRating: userRating });
});
//-----------------------------------Api for socket -------------------------------------
const pushNewServiceReq = (serviceId) => __awaiter(void 0, void 0, void 0, function* () {
    const aggregateArray = [
        {
            $match: {
                status: service_interface_1.Status.FINDING,
                _id: new mongoose_1.default.Types.ObjectId(serviceId),
            },
        },
        {
            $lookup: {
                from: "bids",
                let: { serviceId: "$_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ["$reqServiceId", "$$serviceId"] },
                            status: { $ne: "declined" },
                        },
                    },
                ],
                as: "bid",
            },
        },
        {
            // Reshape the location field here
            $addFields: {
                location: {
                    placeId: "$location.placeId",
                    coordinates: "$location.coordinates.coordinates", // extract inner coordinates array
                },
            },
        },
        {
            $project: { bid: 0 },
        },
    ];
    const data = yield service_model_1.Service.aggregate(aggregateArray);
    return data[0];
});
const addNewBidDataToService = (serviceId, userId, bidId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const service = yield service_model_1.Service.findOne({
        _id: serviceId,
        status: service_interface_1.Status.FINDING,
        user: userId,
    }).lean();
    if (!service || !((_a = service.location) === null || _a === void 0 ? void 0 : _a.coordinates)) {
        throw new Error("Service not found or missing location");
    }
    const bids = yield bid_model_1.Bid.aggregate([
        {
            $match: {
                reqServiceId: service._id,
                _id: new mongoose_1.default.Types.ObjectId(bidId),
            },
        },
        // Step 1: Join Mechanic Profile
        {
            $lookup: {
                from: "mechanicprofiles",
                localField: "mechanicId",
                foreignField: "user",
                as: "mechanicProfile",
            },
        },
        { $unwind: "$mechanicProfile" },
        // Step 2: Join Mechanic Ratings (all ratings of that mechanic)
        {
            $lookup: {
                from: "mechanicratings",
                localField: "mechanicId",
                foreignField: "mechanicId",
                as: "ratingDocs",
            },
        },
        // Step 3: Calculate average rating and count
        {
            $addFields: {
                averageRating: {
                    $cond: [
                        { $gt: [{ $size: "$ratingDocs" }, 0] },
                        {
                            $avg: "$ratingDocs.rating",
                        },
                        0,
                    ],
                },
                totalReviews: { $size: "$ratingDocs" },
            },
        },
        // Step 4: Project only needed fields
        {
            $project: {
                price: 1,
                status: 1,
                mechanicId: 1,
                averageRating: { $round: ["$averageRating", 1] },
                totalReviews: 1,
                "mechanicProfile.fullName": 1,
                "mechanicProfile.image": 1,
                "mechanicProfile.workshop.name": 1,
                "mechanicProfile.workshop.location.placeId": 1,
                "mechanicProfile.workshop.location.coordinates": "$mechanicProfile.workshop.location.coordinates.coordinates",
            },
        },
    ]);
    // Step 5: Add distance in Node.js (still more efficient this way)
    const newData = bids.map((bid) => {
        var _a;
        const coords = (_a = bid.mechanicProfile) === null || _a === void 0 ? void 0 : _a.workshop.location.coordinates;
        console.log(coords);
        const distance = coords
            ? calculateDistance(service.location.coordinates.coordinates, coords)
            : null;
        return Object.assign(Object.assign({}, bid), { distance: distance ? parseFloat(distance.toFixed(2)) : null });
    });
    return newData[0];
});
exports.ServiceService = {
    addServiceReq,
    checkServiceStatusFinding,
    getBidListOfService,
    hireMechanic,
    mechanicDetails,
    getMechanicRatings: exports.getMechanicRatings,
    cancelService,
    seeServiceDetails,
    getRunningService,
    getAllRequestedService,
    seeCurrentServiceProgress,
    pushNewServiceReq,
    addNewBidDataToService,
    changeServiceStatus,
    markServiceAsComplete,
    getUserRatings,
};
//helper function
const calculateDistance = (coords1, coords2) => {
    const R = 6371; // km
    const [lon1, lat1] = coords1;
    const [lon2, lat2] = coords2;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    let dLon = lon2 - lon1;
    if (dLon > 180) {
        dLon -= 360;
    }
    else if (dLon < -180) {
        dLon += 360;
    }
    dLon = dLon * (Math.PI / 180);
    const lat1Rad = lat1 * (Math.PI / 180);
    const lat2Rad = lat2 * (Math.PI / 180);
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(2));
};
