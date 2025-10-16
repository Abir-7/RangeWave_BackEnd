"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceRoute = void 0;
const express_1 = require("express");
const service_controller_1 = require("./service.controller");
const auth_1 = require("../../../middleware/auth/auth");
const carModel_controller_service_1 = require("../../carModel/carModel.controller.service");
const router = (0, express_1.Router)();
//-------------------------------------for user only
router.post("/req-for-help", (0, auth_1.auth)("USER"), service_controller_1.ServiceController.addServiceReq);
router.get("/find-car", carModel_controller_service_1.getCarsData);
router.get("/find-issue", (0, auth_1.auth)("USER"), carModel_controller_service_1.getCarsIssue);
router.get("/mechanic_details/:mechanicId", (0, auth_1.auth)("USER"), service_controller_1.ServiceController.mechanicDetails);
router.get("/mechanic_ratings/:mechanicId", (0, auth_1.auth)("USER"), service_controller_1.ServiceController.getMechanicRatings);
router.get("/list-of-bid/:sId", (0, auth_1.auth)("USER"), service_controller_1.ServiceController.getBidListOfService);
router.get("/check-service-status-finding", (0, auth_1.auth)("USER"), service_controller_1.ServiceController.checkServiceStatusFinding);
router.patch("/hire-mechanic", (0, auth_1.auth)("USER"), service_controller_1.ServiceController.hireMechanic);
router.patch("/mark-service-as-complete/:pId", (0, auth_1.auth)("USER"), service_controller_1.ServiceController.markServiceAsComplete);
//-----------------------------------------for mechanics-------------------------------
router.post("/get-requested-service-list", (0, auth_1.auth)("MECHANIC"), service_controller_1.ServiceController.getAllRequestedService);
router.get("/user_ratings/:userId", 
// auth("MECHANIC"),
service_controller_1.ServiceController.getUserRatings);
router.get("/see-details/:sId", (0, auth_1.auth)("MECHANIC"), service_controller_1.ServiceController.seeServiceDetails);
router.patch("/change-service-status/:pId", (0, auth_1.auth)("MECHANIC"), service_controller_1.ServiceController.changeServiceStatus);
//--------------------------------------for both-------------------------------
router.get("/get-running-service", (0, auth_1.auth)("MECHANIC", "USER"), service_controller_1.ServiceController.getRunningService);
router.get("/see-running-service-progress/:pId", (0, auth_1.auth)("MECHANIC", "USER"), service_controller_1.ServiceController.seeCurrentServiceProgress);
router.patch("/cencel-service/:pId", (0, auth_1.auth)("USER", "MECHANIC"), service_controller_1.ServiceController.cancelService);
//-----------------------------------------------SOCKET----------------------------------------------------------
//---------------------mechanic-------------
router.get("/push-new-service-req/:id", (0, auth_1.auth)("MECHANIC"), service_controller_1.ServiceController.pushNewServiceReq);
//---------------------user----------------
router.get("/push-new-bid-in-service-req/:sId/:bId", (0, auth_1.auth)("USER"), service_controller_1.ServiceController.addNewBidDataToService);
exports.ServiceRoute = router;
