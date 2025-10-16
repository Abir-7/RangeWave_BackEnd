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
exports.UserRatingService = void 0;
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = __importDefault(require("../../../errors/AppError"));
const user_model_1 = __importDefault(require("../../users/user/user.model"));
const userRating_model_1 = __importDefault(require("./userRating.model"));
const addRatingToUser = (ratingData, mechanicId) => __awaiter(void 0, void 0, void 0, function* () {
    const userData = yield user_model_1.default.findOne({
        _id: ratingData.user,
        role: "USER",
    });
    if (!userData) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found.");
    }
    const isExist = yield userRating_model_1.default.findOne({
        serviceId: ratingData.serviceId,
        user: ratingData.user,
    });
    if (isExist) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Rating already given.");
    }
    const newRating = yield userRating_model_1.default.create(Object.assign(Object.assign({}, ratingData), { mechanicId: mechanicId }));
    return newRating;
});
exports.UserRatingService = { addRatingToUser };
