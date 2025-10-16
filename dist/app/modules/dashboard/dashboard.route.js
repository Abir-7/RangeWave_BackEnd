"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardRoute = void 0;
const express_1 = require("express");
const dashboard_controller_1 = require("./dashboard.controller");
const router = (0, express_1.Router)();
router.get("/", dashboard_controller_1.DashboardController.dashboardData); //! need to add auth
router.get("/payment-history", dashboard_controller_1.DashboardController.paymentHistory);
router.get("/user-data", dashboard_controller_1.DashboardController.getUsersByRole);
exports.DashboardRoute = router;
