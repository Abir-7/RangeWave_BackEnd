"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserProfile = void 0;
const mongoose_1 = require("mongoose");
const LocationSchema = new mongoose_1.Schema({
    apartmentNo: { type: String },
    roadNo: { type: String },
    state: { type: String },
    city: { type: String },
    zipCode: { type: String },
    address: { type: String },
    country: { type: String },
}, { _id: false });
const CarInfoSchema = new mongoose_1.Schema({
    carName: { type: String },
    carModel: { type: String },
    vinCode: { type: String },
    licensePlate: { type: String },
    tagNumber: { type: String },
}, { _id: false });
const userProfileSchema = new mongoose_1.Schema({
    fullName: { type: String },
    nickname: { type: String },
    dateOfBirth: { type: Date },
    email: { type: String, unique: true },
    phone: { type: String },
    location: { type: LocationSchema, default: {} },
    image: { type: String, default: "" },
    stripeCustomerId: { type: String },
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
    },
    carInfo: { type: CarInfoSchema, default: {} },
}, { timestamps: true });
exports.UserProfile = (0, mongoose_1.model)("UserProfile", userProfileSchema);
