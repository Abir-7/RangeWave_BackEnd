import mongoose from "mongoose";

const carIssueSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
});

export const CarIssue = mongoose.model("CarIssue", carIssueSchema);
