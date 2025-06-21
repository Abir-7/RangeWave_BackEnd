import { Router } from "express";
import { auth } from "../../../middleware/auth/auth";
import { ExtraWorkController } from "./extraWork.controller";

const router = Router();
router.post(
  "/req-for-extra-work/:sId",
  auth("MECHANIC"),
  ExtraWorkController.reqForExtraWork
);
export const ExtraWorkRoute = router;
