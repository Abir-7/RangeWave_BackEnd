import { Router } from "express";
import { ServiceController } from "./service.controller";
import { auth } from "../../../middleware/auth/auth";

const router = Router();

//-------------------------------------for user only

router.post("/req-for-help", auth("USER"), ServiceController.addServiceReq);

router.get(
  "/list-of-bid/:sId",
  auth("USER"),
  ServiceController.getBidListOfService
);

router.get(
  "/check-service-status-finding",
  auth("USER"),
  ServiceController.checkServiceStatusFinding
);

router.patch("/hire-mechanic", auth("USER"), ServiceController.hireMechanic);

router.patch(
  "/mark-service-as-complete/:pId",
  auth("USER"),
  ServiceController.markServiceAsComplete
);
router.patch(
  "/accept-extra-work",
  auth("USER"),
  ServiceController.acceptExtraWork
);

//-----------------------------------------for mechanics-------------------------------
router.post(
  "/get-requested-service-list",
  auth("MECHANIC"),
  ServiceController.getAllRequestedService
);

router.get(
  "/see-details/:sId",
  auth("MECHANIC"),
  ServiceController.seeServiceDetails
);

router.patch(
  "/change-service-status/:pId",
  auth("MECHANIC"),
  ServiceController.changeServiceStatus
);

//--------------------------------------for both-------------------------------
router.get(
  "/get-running-service",
  auth("MECHANIC", "USER"),
  ServiceController.getRunningService
);

router.get(
  "/see-running-service-progress/:pId",
  auth("MECHANIC", "USER"),
  ServiceController.seeCurrentServiceProgress
);

router.patch(
  "/cencel-service/:pId",
  auth("USER", "MECHANIC"),
  ServiceController.cancelService
);

//-----------------------------------------------SOCKET----------------------------------------------------------

//---------------------mechanic-------------

router.get(
  "/push-new-service-req/:id",
  auth("MECHANIC"),
  ServiceController.pushNewServiceReq
);

//---------------------user----------------
router.get(
  "/push-new-bid-in-service-req/:sId/:bId",
  auth("USER"),
  ServiceController.addNewBidDataToService
);

export const ServiceRoute = router;
