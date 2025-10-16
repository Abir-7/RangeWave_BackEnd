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
exports.DashboardController = void 0;
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const dashboard_service_1 = require("./dashboard.service");
const dashboardData = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield dashboard_service_1.DashboardService.dashboardData();
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: 200,
        message: "Dashboard data is fetched successfully",
        data: result,
    });
}));
const paymentHistory = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield dashboard_service_1.DashboardService.paymentHistory();
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: 200,
        message: "Payment history fetched successfully",
        data: result,
    });
}));
const getUsersByRole = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield dashboard_service_1.DashboardService.getUsersByRole(req.query.role);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: 200,
        message: "User data fetched successfully",
        data: result,
    });
}));
exports.DashboardController = {
    dashboardData,
    paymentHistory,
    getUsersByRole,
};
