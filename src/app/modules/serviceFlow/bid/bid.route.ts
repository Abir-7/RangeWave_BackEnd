import { Router } from "express";
import { auth } from "../../../middleware/auth/auth";
import { BidController } from "./bid.controller";
import zodValidator from "../../../middleware/zodValidator";
import { zodBidRequestSchema } from "./bid.validation";

const router = Router();
router.post(
  "/add-bid",
  auth("MECHANIC"),
  zodValidator(zodBidRequestSchema),
  BidController.addBid
);
router.post("/decline-bid", auth("MECHANIC"), BidController.declinedBid);
router.get("/bid-history", auth("MECHANIC"), BidController.bidHistory);

export const BidRoute = router;
