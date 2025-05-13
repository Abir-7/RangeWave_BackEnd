import { model, Schema } from "mongoose";
import { BidStatus, IBid } from "./bid.interface";

const BidSchema = new Schema<IBid>(
  {
    price: {
      type: Number,
      required: true,
    },
    reqServiceId: {
      type: Schema.Types.ObjectId,
      ref: "Service", // Assuming you have a ServiceRequest model
      required: true,
    },
    mechanicId: {
      type: Schema.Types.ObjectId,
      ref: "User", // Assuming you have a Mechanic model
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(BidStatus),
    },
  },
  { timestamps: true }
);

// Mongoose Model
const Bid = model<IBid>("Bid", BidSchema);

export default Bid;
