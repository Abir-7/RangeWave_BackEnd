import { Router } from "express";
import { auth } from "../../../middleware/auth/auth";
import { ExtraWorkController } from "./extraWork.controller";

const router = Router();
router.post(
  "/req-for-extra-work/:sId",
  auth("MECHANIC"),
  ExtraWorkController.reqForExtraWork
);
router.post(
  "/reject-req-for-extrawork/:sId",
  auth("USER"),
  ExtraWorkController.rejectReqForExtrawork
);
router.post(
  "/accept-req-for-extrawork/:sId",
  auth("USER"),
  ExtraWorkController.acceptReqForExtrawork
);
export const ExtraWorkRoute = router;
