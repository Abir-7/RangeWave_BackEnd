import { Router } from "express";
import { DashboardController } from "./dashboard.controller";

const router = Router();

router.get("/", DashboardController.dashboardData); //! need to add auth

export const DashboardRoute = router;
