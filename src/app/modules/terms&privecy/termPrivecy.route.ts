import { Router } from "express";

import { auth } from "../../middleware/auth/auth";
import { PrivecyController } from "./termPrivecy.controller";

const router = Router();

// POST /api/policy/upsert
router.post("/upsert", auth("ADMIN"), PrivecyController.upsertPolicy);
router.get("/", PrivecyController.getPrivecy);

export const PrivecyRoute = router;
