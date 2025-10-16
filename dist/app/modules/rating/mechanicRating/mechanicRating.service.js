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
exports.MechanicRatingService = void 0;
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = __importDefault(require("../../../errors/AppError"));
const user_model_1 = __importDefault(require("../../users/user/user.model"));
const mechanicRating_model_1 = __importDefault(require("./mechanicRating.model"));
const addRatingToMechanic = (ratingData, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const mechanicData = yield user_model_1.default.findOne({
        _id: ratingData.mechanicId,
        role: "MECHANIC",
    });
    if (!mechanicData) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Mechanic not found.");
    }
    const isExist = yield mechanicRating_model_1.default.findOne({
        serviceId: ratingData.serviceId,
        mechanicId: ratingData.mechanicId,
    });
    if (isExist) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Rating already given.");
    }
    const newRating = yield mechanicRating_model_1.default.create(Object.assign(Object.assign({}, ratingData), { user: userId }));
    return newRating;
});
exports.MechanicRatingService = { addRatingToMechanic };
