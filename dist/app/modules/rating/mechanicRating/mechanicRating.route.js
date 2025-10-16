"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MechanicRatingRoute = void 0;
const express_1 = require("express");
const auth_1 = require("../../../middleware/auth/auth");
const mechanicRating_controller_1 = require("./mechanicRating.controller");
const router = (0, express_1.Router)();
router.post("/add-rating-to-mechanic", (0, auth_1.auth)("USER"), mechanicRating_controller_1.MechanicRatingController.addRatingToMechanic);
exports.MechanicRatingRoute = router;
