"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MechanicProfileRoute = void 0;
const express_1 = require("express");
const auth_1 = require("../../../middleware/auth/auth");
const mechanicProfile_controller_1 = require("./mechanicProfile.controller");
const zodValidator_1 = __importDefault(require("../../../middleware/zodValidator"));
const mechanicProfile_validation_1 = require("./mechanicProfile.validation");
const router = (0, express_1.Router)();
router.patch("/update-mechanic-profile", (0, auth_1.auth)("MECHANIC"), (0, zodValidator_1.default)(mechanicProfile_validation_1.MechanicProfileUpdateSchema), mechanicProfile_controller_1.MechanicProfileController.updateMechanicProfile);
exports.MechanicProfileRoute = router;
