import mongoose, { Schema } from "mongoose";

const carIssueSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
});

export const CarIssue = mongoose.model("CarIssue", carIssueSchema);

const carUserIssueSchema = new mongoose.Schema({
  name: { type: String, required: true },
  user: { type: Schema.Types.ObjectId, required: true },
});

carUserIssueSchema.index({ name: 1 });

carUserIssueSchema.index({ name: "text" });

carUserIssueSchema.index({ user: 1, name: 1 });

export const UserCarIssue = mongoose.model("UserCarIssue", carUserIssueSchema);
