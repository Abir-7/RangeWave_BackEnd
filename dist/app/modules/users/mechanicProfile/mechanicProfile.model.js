"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MechanicProfile = void 0;
const mongoose_1 = require("mongoose");
const WorkingHourSchema = new mongoose_1.Schema({
    start: { type: String },
    end: { type: String },
}, { _id: false });
const CertificateSchema = new mongoose_1.Schema({
    institutionName: { type: String },
    startTime: { type: String },
    endTime: { type: String },
}, { _id: false });
const LocationSchema = new mongoose_1.Schema({
    apartmentNo: { type: String },
    roadNo: { type: String },
    state: { type: String },
    city: { type: String },
    zipCode: { type: String },
    address: { type: String },
    country: { type: String },
}, { _id: false });
const MechanicProfileSchema = new mongoose_1.Schema({
    fullName: { type: String },
    email: { type: String },
    location: { type: LocationSchema, default: {} },
    phoneNumber: { type: String, default: "" },
    image: { type: String },
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    stripeAccountId: { type: String, default: "" },
    workshop: {
        _id: false,
        name: { type: String },
        workingHours: { type: WorkingHourSchema, default: {} },
        services: [{ type: String }],
        location: {
            name: { type: String },
            placeId: { type: String },
            coordinates: {
                type: {
                    type: String,
                    enum: ["Point"],
                },
                coordinates: {
                    type: [Number],
                },
            },
        },
    },
    experience: [{ type: String, _id: false }],
    certificates: [CertificateSchema],
    isNeedToPayForWorkShop: { type: Boolean, default: false },
    isStripeActive: { type: Boolean, default: false },
}, {
    timestamps: true,
});
// Add a 2dsphere index to the coordinates field
MechanicProfileSchema.index({ "workshop.location.coordinates": "2dsphere" });
// Create and export the model
exports.MechanicProfile = (0, mongoose_1.model)("MechanicProfile", MechanicProfileSchema);
