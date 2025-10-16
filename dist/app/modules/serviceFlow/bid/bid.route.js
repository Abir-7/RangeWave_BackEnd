"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BidRoute = void 0;
const express_1 = require("express");
const auth_1 = require("../../../middleware/auth/auth");
const bid_controller_1 = require("./bid.controller");
const zodValidator_1 = __importDefault(require("../../../middleware/zodValidator"));
const bid_validation_1 = require("./bid.validation");
const router = (0, express_1.Router)();
router.post("/add-bid", (0, auth_1.auth)("MECHANIC"), (0, zodValidator_1.default)(bid_validation_1.zodBidRequestSchema), bid_controller_1.BidController.addBid);
router.post("/decline-bid", (0, auth_1.auth)("MECHANIC"), bid_controller_1.BidController.declinedBid);
router.get("/bid-history", (0, auth_1.auth)("MECHANIC"), bid_controller_1.BidController.bidHistory);
exports.BidRoute = router;
