import { Router } from "express";
import { ServiceController } from "./service.controller";
import { auth } from "../../../middleware/auth/auth";

const router = Router();

//for user only
router.post("/req-for-help", auth("USER"), ServiceController.addServiceReq);

router.get(
  "/list-of-bid/:sId",
  auth("USER"),
  ServiceController.getBidListOfService
);

router.patch("/hire-mechanic", auth("USER"), ServiceController.hireMechanic);

router.patch("/cancel/:id", auth("USER"), ServiceController.cancelService);

//for mechanics
router.get(
  "/see-details/:sId",
  auth("MECHANIC"),
  ServiceController.seeServiceDetails
);

router.post(
  "/req-for-extra-work/:sId",
  auth("MECHANIC"),
  ServiceController.reqForExtraWork
);

//for both
router.get(
  "/get-running-service",
  auth("MECHANIC", "USER"),
  ServiceController.getRunningService
);

export const ServiceRoute = router;
