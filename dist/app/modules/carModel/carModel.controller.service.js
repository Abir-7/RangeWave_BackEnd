"use strict";
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
// services/car.service.ts
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
exports.getCarsIssue = exports.getCars = exports.getCarsData = void 0;
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const carModel_interface_model_1 = require("./carModel.interface.model");
const carIssuse_model_1 = require("../carIssue/carIssuse.model");
const logger_1 = __importDefault(require("../../utils/logger"));
exports.getCarsData = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield (0, exports.getCars)(req.query.searchTerm);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: 200,
        message: "Car data fetched.",
        data: result,
    });
}));
const getCars = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (search = "") {
    const query = {};
    if (search) {
        query.model = { $regex: search, $options: "i" }; // case-insensitive search
    }
    const cars = yield carModel_interface_model_1.Car.find(query).limit(20).lean();
    return cars.map((c) => c.model);
});
exports.getCars = getCars;
exports.getCarsIssue = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield findCarIssues(req.user.userId, req.query.searchTerm);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: 200,
        message: "Car issue data fetched.",
        data: result,
    });
}));
// const findCarIssues = async (searchTerm: string = "", limit: number = 30) => {
//   try {
//     // Build a case-insensitive regex for search
//     const regex = new RegExp(searchTerm, "i");
//     const issues = await CarIssue.find({ name: { $regex: regex } })
//       .limit(limit)
//       .exec();
//     return issues.map((issue) => issue.name);
//   } catch (error) {
//     console.error("❌ Error finding car issues:", error);
//     throw error;
//   }
// };
const findCarIssues = (userId_1, ...args_1) => __awaiter(void 0, [userId_1, ...args_1], void 0, function* (userId, searchTerm = "", limit = 30) {
    try {
        const regex = new RegExp(searchTerm, "i");
        const halfLimit = Math.floor(limit / 2);
        // Fetch user-specific issues first
        const userIssuesPromise = carIssuse_model_1.UserCarIssue.find({
            user: userId,
            name: { $regex: regex },
        })
            .sort({ name: 1 })
            .limit(halfLimit)
            .lean();
        // Fetch global issues next
        const globalIssuesPromise = carIssuse_model_1.CarIssue.find({
            name: { $regex: regex },
        })
            .sort({ name: 1 })
            .limit(halfLimit)
            .lean();
        const [userIssues, globalIssues] = yield Promise.all([
            userIssuesPromise,
            globalIssuesPromise,
        ]);
        // Extract names
        const userNames = userIssues.map((i) => i.name);
        const globalNames = globalIssues.map((i) => i.name);
        // Merge user first, then global, remove duplicates (case-insensitive)
        const result = [];
        const seen = new Set();
        for (const name of [...userNames, ...globalNames]) {
            const lower = name.toLowerCase();
            if (!seen.has(lower)) {
                seen.add(lower);
                result.push(name);
            }
        }
        return result.slice(0, limit);
    }
    catch (error) {
        logger_1.default.error("❌ Error finding car issues:", error);
        throw error;
    }
});
