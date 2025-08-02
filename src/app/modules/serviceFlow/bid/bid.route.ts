import { Router } from "express";
import { auth } from "../../../middleware/auth/auth";
import { BidController } from "./bid.controller";

const router = Router();
router.post("/add-bid", auth("MECHANIC"), BidController.addBid);
router.post("/decline-bid", auth("MECHANIC"), BidController.declinedBid);

export const BidRoute = router;
