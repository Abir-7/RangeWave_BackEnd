"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const payment_interface_1 = require("./payment.interface");
const paymentSchema = new mongoose_1.Schema({
    txId: {
        type: String,
        required: function () {
            return this.paymentType === payment_interface_1.PaymentType.ONLINE;
        },
        trim: true,
    },
    bidId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Bid",
        required: true,
    },
    serviceId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Service",
        required: true,
    },
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    mechanicId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    status: {
        type: String,
        enum: Object.values(payment_interface_1.PaymentStatus),
        default: payment_interface_1.PaymentStatus.UNPAID,
        required: true,
    },
    paymentType: {
        type: String,
        enum: Object.values(payment_interface_1.PaymentType),
        default: null,
    },
    amount: {
        type: Number,
        required: true,
        min: 0,
    },
    extraAmount: {
        type: Number,
        min: 0,
        default: 0,
    },
}, {
    timestamps: true,
    id: false,
});
paymentSchema.virtual("mechanicProfile", {
    ref: "MechanicProfile", // model name
    localField: "mechanicId", // field in Payment
    foreignField: "user", // field in MechanicProfile
    justOne: true, // because one mechanicId -> one profile
});
paymentSchema.virtual("userProfile", {
    ref: "UserProfile",
    localField: "user", // in Payment
    foreignField: "user", // in UserProfile
    justOne: true,
});
paymentSchema.set("toObject", { virtuals: true });
paymentSchema.set("toJSON", { virtuals: true });
const Payment = (0, mongoose_1.model)("Payment", paymentSchema);
exports.default = Payment;
