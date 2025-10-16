"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRatingRoute = void 0;
const express_1 = require("express");
const auth_1 = require("../../../middleware/auth/auth");
const userRating_controller_1 = require("./userRating.controller");
const router = (0, express_1.Router)();
router.post("/add-rating-to-user", (0, auth_1.auth)("MECHANIC"), userRating_controller_1.UserRatingController.addRatingToUser);
exports.UserRatingRoute = router;
