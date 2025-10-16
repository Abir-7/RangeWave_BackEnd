"use strict";
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
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
exports.UserService = void 0;
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = __importDefault(require("../../../errors/AppError"));
const getRelativeFilePath_1 = require("../../../middleware/fileUpload/getRelativeFilePath");
const userProfile_model_1 = require("../userProfile/userProfile.model");
const user_model_1 = __importDefault(require("./user.model"));
const adminProfile_model_1 = require("../adminProfile/adminProfile.model");
const mechanicProfile_model_1 = require("../mechanicProfile/mechanicProfile.model");
const unlinkFiles_1 = __importDefault(require("../../../utils/unlinkFiles"));
const mongoose_1 = __importDefault(require("mongoose"));
const updateProfileImage = (path, email) => __awaiter(void 0, void 0, void 0, function* () {
    const image = (0, getRelativeFilePath_1.getRelativePath)(path);
    const user = yield user_model_1.default.findOne({ email: email });
    let profile;
    if ((user === null || user === void 0 ? void 0 : user.role) === "USER") {
        profile = yield userProfile_model_1.UserProfile.findOne({ user: user._id });
        if (profile === null || profile === void 0 ? void 0 : profile.image) {
            (0, unlinkFiles_1.default)(profile.image);
        }
        if (profile) {
            profile.image = image;
        }
    }
    if ((user === null || user === void 0 ? void 0 : user.role) === "ADMIN") {
        profile = yield adminProfile_model_1.AdminProfile.findOne({ user: user._id });
        if (profile === null || profile === void 0 ? void 0 : profile.image) {
            (0, unlinkFiles_1.default)(profile.image);
        }
        if (profile) {
            profile.image = image;
        }
    }
    if ((user === null || user === void 0 ? void 0 : user.role) === "MECHANIC") {
        profile = yield mechanicProfile_model_1.MechanicProfile.findOne({ user: user._id });
        if (profile === null || profile === void 0 ? void 0 : profile.image) {
            (0, unlinkFiles_1.default)(profile.image);
        }
        if (profile) {
            profile.image = image;
        }
    }
    yield (profile === null || profile === void 0 ? void 0 : profile.save());
    if (!profile) {
        (0, unlinkFiles_1.default)(image);
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Failed to update image.");
    }
    return profile;
});
const getProfileData = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield user_model_1.default.aggregate([
        { $match: { _id: new mongoose_1.default.Types.ObjectId(userId) } },
        // Lookup AdminProfile
        {
            $lookup: {
                from: "adminprofiles", // MongoDB collection name (usually lowercase + plural)
                localField: "_id",
                foreignField: "user",
                as: "adminProfile",
            },
        },
        // Lookup UserProfile
        {
            $lookup: {
                from: "userprofiles",
                localField: "_id",
                foreignField: "user",
                as: "userProfile",
            },
        },
        // Lookup MechanicProfile
        {
            $lookup: {
                from: "mechanicprofiles",
                localField: "_id",
                foreignField: "user",
                as: "mechanicProfile",
            },
        },
        // Add a field 'profile' that picks adminProfile if role === 'admin', else userProfile
        {
            $addFields: {
                profile: {
                    $switch: {
                        branches: [
                            {
                                case: { $eq: ["$role", "ADMIN"] },
                                then: { $arrayElemAt: ["$adminProfile", 0] },
                            },
                            {
                                case: { $eq: ["$role", "MECHANIC"] },
                                then: { $arrayElemAt: ["$mechanicProfile", 0] },
                            },
                            {
                                case: { $eq: ["$role", "USER"] },
                                then: { $arrayElemAt: ["$userProfile", 0] },
                            },
                        ],
                        default: null,
                    },
                },
            },
        },
        // Optionally remove adminProfile and userProfile arrays if you want cleaner output
        {
            $project: {
                adminProfile: 0,
                userProfile: 0,
                password: 0, // also hide password hash
                mechanicProfile: 0,
            },
        },
    ]);
    // result is an array with one element or empty if not found
    return result[0] || null;
});
const deleteUser = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.default.findOneAndUpdate({
        _id: userId,
    }, {
        isDeleted: true,
    });
    if (!user) {
        throw new Error("Faild to delete user");
    }
    return user;
});
exports.UserService = {
    updateProfileImage,
    getProfileData,
    deleteUser,
};
