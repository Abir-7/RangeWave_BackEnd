"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Service = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const service_interface_1 = require("./service.interface");
const serviceSchema = new mongoose_1.Schema({
    issue: { type: String, required: true },
    description: { type: String, required: true },
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    status: {
        type: String,
        enum: [...Object.values(service_interface_1.Status)],
        default: service_interface_1.Status.FINDING,
    },
    isServiceCompleted: {
        type: String,
        enum: [...Object.values(service_interface_1.IsServiceCompleted)],
        default: service_interface_1.IsServiceCompleted.NO,
    },
    cancelReson: {
        type: String,
        enum: Object.values(service_interface_1.CancelReason),
        required: function () {
            return this.status === service_interface_1.Status.CANCELLED; // Only required if status is 'cancel'
        },
    },
    location: {
        placeId: {
            type: String,
        },
        coordinates: {
            type: { type: String, enum: ["Point"] }, // 'Point' is the type
            coordinates: {
                type: [Number], // Array of numbers (longitude, latitude)
            },
        },
    },
    bidId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Bid",
        default: null,
    },
    schedule: {
        isSchedule: {
            type: Boolean,
            required: true,
            default: false,
        },
        date: {
            type: Date,
            required: false,
            default: null,
        },
    },
}, { timestamps: true });
serviceSchema.index({ status: 1 });
exports.Service = mongoose_1.default.model("Service", serviceSchema);
