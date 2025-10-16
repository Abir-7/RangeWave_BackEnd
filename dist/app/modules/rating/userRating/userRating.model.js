"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
// Define the user rating schema
const userRatingSchema = new mongoose_1.Schema({
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
    mechanicId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    text: {
        type: String,
    },
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    serviceId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Service",
        required: true,
    },
}, { timestamps: true });
// Create the model from the schema
const UserRating = (0, mongoose_1.model)("UserRating", userRatingSchema);
exports.default = UserRating;
