import { Router } from "express";
import { DashboardController } from "./dashboard.controller";

const router = Router();

router.get("/", DashboardController.dashboardData); //! need to add auth
router.get("/payment-history", DashboardController.paymentHistory);
router.get("/user-data", DashboardController.getUsersByRole);
export const DashboardRoute = router;
