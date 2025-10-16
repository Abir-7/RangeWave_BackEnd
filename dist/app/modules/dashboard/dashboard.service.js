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
exports.DashboardService = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
const auth_interface_1 = require("../../interface/auth.interface");
const service_model_1 = require("../serviceFlow/service/service.model");
const payment_model_1 = __importDefault(require("../stripe/payment.model"));
const user_model_1 = __importDefault(require("../users/user/user.model"));
const dashboardData = () => __awaiter(void 0, void 0, void 0, function* () {
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear + 1, 0, 1);
    const dayStats = yield service_model_1.Service.aggregate([
        {
            $match: {
                createdAt: {
                    $gte: startOfYear,
                    $lt: endOfYear,
                },
            },
        },
        {
            $group: {
                _id: {
                    year: { $year: "$createdAt" },
                    month: { $month: "$createdAt" },
                    day: { $dayOfMonth: "$createdAt" },
                },
                totalService: { $sum: 1 },
            },
        },
        {
            $sort: {
                "_id.year": 1,
                "_id.month": 1,
                "_id.day": 1,
            },
        },
    ]);
    const months = [
        "",
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ];
    const monthlyData = {};
    for (const { _id: { year, month, day }, totalService, } of dayStats) {
        const monthName = months[month];
        const monthKey = `${monthName} ${year}`;
        const date = `${monthName} ${day}, ${year}`;
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = [];
        }
        monthlyData[monthKey].push({ day, totalService, date });
    }
    // Fill missing days with totalService = 0
    for (const monthKey in monthlyData) {
        const [monthName, yearStr] = monthKey.split(" ");
        const year = Number(yearStr);
        const monthIndex = months.indexOf(monthName);
        // Get number of days in the month
        const daysInMonth = new Date(year, monthIndex, 0).getDate();
        // Map existing days for quick lookup
        const dayMap = new Map(monthlyData[monthKey].map((d) => [d.day, d]));
        const fullDays = [];
        for (let d = 1; d <= daysInMonth; d++) {
            if (dayMap.has(d)) {
                fullDays.push(dayMap.get(d));
            }
            else {
                fullDays.push({
                    day: d,
                    totalService: 0,
                    date: `${monthName} ${d}, ${year}`,
                });
            }
        }
        monthlyData[monthKey] = fullDays;
    }
    const [totalMechanic, totalUser] = yield Promise.all([
        user_model_1.default.countDocuments({
            role: auth_interface_1.userRoles.MECHANIC,
            isVerified: true,
            isDeleted: false,
            isBlocked: false,
        }),
        user_model_1.default.countDocuments({
            role: auth_interface_1.userRoles.USER,
            isVerified: true,
            isDeleted: false,
            isBlocked: false,
        }),
    ]);
    return {
        monthlyData,
        totalMechanic,
        totalUser,
    };
});
const paymentHistory = () => __awaiter(void 0, void 0, void 0, function* () {
    const history = yield payment_model_1.default.find()
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
    return history;
});
const getUsersByRole = (role, searchTerm) => __awaiter(void 0, void 0, void 0, function* () {
    const roleFilter = role === "USER"
        ? ["USER"]
        : role === "MECHANIC"
            ? ["MECHANIC"]
            : ["USER", "MECHANIC"];
    const matchStage = {
        role: { $in: roleFilter },
        isBlocked: false,
        isDeleted: false,
        isVerified: true,
    };
    if (searchTerm) {
        matchStage.$or = [
            { email: { $regex: searchTerm, $options: "i" } }, // match email
        ];
    }
    const result = yield user_model_1.default.aggregate([
        { $match: matchStage },
        {
            $lookup: {
                from: "userprofiles",
                localField: "_id",
                foreignField: "user",
                as: "userProfile",
            },
        },
        {
            $lookup: {
                from: "mechanicprofiles",
                localField: "_id",
                foreignField: "user",
                as: "mechanicProfile",
            },
        },
        {
            $addFields: {
                profile: {
                    $cond: [
                        { $eq: ["$role", "USER"] },
                        { $arrayElemAt: ["$userProfile", 0] },
                        { $arrayElemAt: ["$mechanicProfile", 0] },
                    ],
                },
            },
        },
        // Optional: Filter by profile.name (after join)
        ...(searchTerm
            ? [
                {
                    $match: {
                        $or: [
                            { email: { $regex: searchTerm, $options: "i" } },
                            { "profile.fullName": { $regex: searchTerm, $options: "i" } },
                        ],
                    },
                },
            ]
            : []),
        {
            $project: {
                password: 0,
                userProfile: 0,
                mechanicProfile: 0,
            },
        },
    ]);
    return result;
});
exports.DashboardService = {
    dashboardData,
    paymentHistory,
    getUsersByRole,
};
