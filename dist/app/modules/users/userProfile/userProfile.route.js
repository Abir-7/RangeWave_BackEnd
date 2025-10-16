"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserProfileRoute = void 0;
const express_1 = require("express");
const auth_1 = require("../../../middleware/auth/auth");
const userProfile_controller_1 = require("./userProfile.controller");
//import zodValidator from "../../../middleware/zodValidator";
//import { UserProfileUpdateSchema } from "./userProfile.validation";
const router = (0, express_1.Router)();
router.patch("/update-user-profile", (0, auth_1.auth)("USER"), 
//  zodValidator(UserProfileUpdateSchema),
userProfile_controller_1.UserProfileController.updateUserProfile);
exports.UserProfileRoute = router;
