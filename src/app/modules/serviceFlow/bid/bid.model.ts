import { model, Schema } from "mongoose";
import { BidStatus } from "./bid.interface";

const bidSchema = new Schema(
  {
    price: { type: Number, required: true },
    reqServiceId: {
      type: Schema.Types.ObjectId,
      ref: "RequestedService",
      required: true,
    },
    mechanicId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: Object.values(BidStatus), required: true },
    extraWork: {
      issue: { type: String, default: "" },
      description: { type: String, default: "" },
      price: { type: Number, default: 0 },
    },
    location: {
      placeId: { type: String, required: true },
      coordinates: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point",
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
          required: true,
        },
      },
    },
  },
  {
    timestamps: true,
  }
);

// Ensure 2dsphere index for geolocation
bidSchema.index({ "location.coordinates": "2dsphere" });

export const Bid = model("Bid", bidSchema);
