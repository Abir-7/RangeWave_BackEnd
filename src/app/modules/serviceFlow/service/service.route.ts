import { Router } from "express";
import { ServiceController } from "./service.controller";
import { auth } from "../../../middleware/auth/auth";

const router = Router();

//for user only
router.post("/req-for-help", auth("USER"), ServiceController.createService);

router.get(
  "/list-of-bid/:sId",
  auth("USER"),
  ServiceController.getBidListOfService
);

router.patch("/hire-mechanic", auth("USER"), ServiceController.hireMechanic);

router.patch("/cancel/:id", auth("USER"), ServiceController.cancelService);

//for mechanics

//for both

export const ServiceRoute = router;
