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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserProfileService = void 0;
/* eslint-disable arrow-body-style */
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = __importDefault(require("../../../errors/AppError"));
const userProfile_model_1 = require("./userProfile.model");
const removeFalsyField_1 = require("../../../utils/helper/removeFalsyField");
const user_model_1 = __importDefault(require("../user/user.model"));
const mongoose_1 = __importDefault(require("mongoose"));
const updateUserProfile = (email, data) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession();
    try {
        session.startTransaction();
        // Fetch the profile data within the transaction
        const profileData = yield userProfile_model_1.UserProfile.findOne({ email }).session(session);
        if (!profileData) {
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User profile not found.");
        }
        const { fullName, carInfo, dateOfBirth, location, phone, nickname } = data;
        // Update the profile data if the fields are provided
        if (fullName) {
            profileData.fullName = fullName;
        }
        if (nickname) {
            profileData.nickname = nickname;
        }
        if (dateOfBirth) {
            profileData.dateOfBirth = dateOfBirth;
        }
        if (phone) {
            profileData.phone = phone;
        }
        // Update carInfo if provided
        if (carInfo && Object.keys(carInfo).length > 0) {
            if (!profileData.carInfo) {
                profileData.carInfo = {
                    carName: "",
                    carModel: "",
                    vinCode: "",
                    licensePlate: "",
                    tagNumber: "",
                };
            }
            const newCarInfo = (0, removeFalsyField_1.removeFalsyFields)(carInfo);
            for (const key in newCarInfo) {
                const value = newCarInfo[key];
                if (value && typeof value === "string") {
                    profileData.carInfo[key] = value;
                }
            }
        }
        // Update location if provided
        if (location && Object.keys(location).length > 0) {
            const other = __rest(location, []);
            const locations = (0, removeFalsyField_1.removeFalsyFields)(other);
            if (profileData.location) {
                for (const field in locations) {
                    profileData.location[field] = locations[field];
                }
            }
        }
        // Save the updated profile data within the transaction
        yield profileData.save({ session });
        // Update the `needToUpdateProfile` field in the User model
        yield user_model_1.default.findByIdAndUpdate(profileData.user, {
            needToUpdateProfile: false,
        }).session(session);
        // Commit the transaction
        yield session.commitTransaction();
        session.endSession();
        return profileData;
    }
    catch (error) {
        // If any error occurs, abort the transaction
        yield session.abortTransaction();
        session.endSession();
        throw error;
    }
});
exports.UserProfileService = { updateUserProfile };
