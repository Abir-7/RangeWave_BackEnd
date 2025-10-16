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
exports.UserRatingController = void 0;
const catchAsync_1 = __importDefault(require("../../../utils/catchAsync"));
const userRating_service_1 = require("./userRating.service");
const sendResponse_1 = __importDefault(require("../../../utils/sendResponse"));
const addRatingToUser = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const ratingData = req.body;
    const result = yield userRating_service_1.UserRatingService.addRatingToUser(ratingData, req.user.userId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: 200,
        message: "Rating given successfully",
        data: result,
    });
}));
exports.UserRatingController = {
    addRatingToUser,
};
