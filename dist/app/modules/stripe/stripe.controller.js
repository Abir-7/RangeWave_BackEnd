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
exports.StripeController = void 0;
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const stripe_service_1 = require("./stripe.service");
const logger_1 = __importDefault(require("../../utils/logger"));
const http_status_1 = __importDefault(require("http-status"));
const createAndConnect = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield stripe_service_1.StripeService.createAndConnect(req.user.userEmail);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: 200,
        message: "Success",
        data: result,
    });
}));
const stripeWebhook = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const sig = req.headers["stripe-signature"];
    const rawBody = req.body;
    logger_1.default.info("hit");
    const result = yield stripe_service_1.StripeService.stripeWebhook(rawBody, sig);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Webhook response",
        data: result,
    });
}));
const zoneExclusivePayment = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield stripe_service_1.StripeService.zoneExclusivePayment(req.user.userId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Webhook response",
        data: result,
    });
}));
const getExpressDashboardLink = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield stripe_service_1.StripeService.getExpressDashboardLink(req.user.userId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Dashboard link created",
        data: result,
    });
}));
exports.StripeController = {
    createAndConnect,
    stripeWebhook,
    zoneExclusivePayment,
    getExpressDashboardLink,
};
