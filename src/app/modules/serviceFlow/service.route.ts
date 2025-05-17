import { Router } from "express";
import { ServiceController } from "./service/service.controller";
import { auth } from "../../middleware/auth/auth";

const router = Router();

//for user only
router.post("/req-for-help", auth("USER"), ServiceController.addServiceReq);
router.patch("/cancel/:id", auth("USER"), ServiceController.cancelService);

//for mechanics

//for both

export const ServiceRoute = router;
