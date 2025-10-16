"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrivecyRoute = void 0;
const express_1 = require("express");
const auth_1 = require("../../middleware/auth/auth");
const termPrivecy_controller_1 = require("./termPrivecy.controller");
const router = (0, express_1.Router)();
// POST /api/policy/upsert
router.post("/upsert", (0, auth_1.auth)("ADMIN"), termPrivecy_controller_1.PrivecyController.upsertPolicy);
router.get("/", termPrivecy_controller_1.PrivecyController.getPrivecy);
exports.PrivecyRoute = router;
