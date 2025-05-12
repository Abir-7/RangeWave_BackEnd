import { Router } from "express";
import { ServiceController } from "./service.controller";
import { auth } from "../../../middleware/auth/auth";

const router = Router();

//for user only
router.post("/req-for-help", auth("USER"), ServiceController.createService);
router.patch("/cancel/:id", auth("USER"), ServiceController.cancelService);

//for mechanics

//for both
router.get("/:id", auth("MECHANIC", "USER"), ServiceController.getService);
export const ServiceRoute = router;
