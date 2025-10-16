"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bid = void 0;
const mongoose_1 = require("mongoose");
const bid_interface_1 = require("./bid.interface");
const bidSchema = new mongoose_1.Schema({
    price: { type: Number, required: true },
    reqServiceId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "RequestedService",
        required: true,
    },
    mechanicId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: Object.values(bid_interface_1.BidStatus), required: true },
    extraWork: {
        issue: { type: String, default: "" },
        description: { type: String, default: "" },
        price: { type: Number, default: 0 },
    },
    location: {
        type: {
            placeId: { type: String },
            coordinates: {
                type: {
                    type: String,
                    enum: ["Point"],
                    default: "Point",
                },
                coordinates: {
                    type: [Number],
                },
            },
        },
        default: null, // <-- makes the whole location optional
    },
}, {
    timestamps: true,
});
// Ensure 2dsphere index for geolocation
bidSchema.index({ "location.coordinates": "2dsphere" });
exports.Bid = (0, mongoose_1.model)("Bid", bidSchema);
