import { Router } from "express";
import { auth } from "../../../middleware/auth/auth";
import { ExtraWorkController } from "./extraWork.controller";

const router = Router();
router.post(
  "/req-for-extra-work",
  auth("MECHANIC"),
  ExtraWorkController.reqForExtraWork
);
router.patch(
  "/reject-req-for-extrawork/:pId",
  auth("USER"),
  ExtraWorkController.rejectReqForExtrawork
);
router.patch(
  "/accept-req-for-extrawork/:pId",
  auth("USER"),
  ExtraWorkController.acceptReqForExtrawork
);
export const ExtraWorkRoute = router;
