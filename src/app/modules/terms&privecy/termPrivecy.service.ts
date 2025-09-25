/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import AppError from "../../errors/AppError";
import { Policy } from "./termPrivecy.interface.model";

type PolicyField = "term" | "privacy";

const upsertPolicy = async (field: PolicyField, value: string) => {
  // Find the single policy document

  if (!field || !value) {
    throw new AppError(404, "Field and value are required");
  }

  if (!["term", "privacy"].includes(field)) {
    throw new AppError(500, "Field must be either 'term' or 'privacy'");
  }

  let policy = await Policy.findOne();

  if (!policy) {
    // If no document exists, create one with the field
    policy = new Policy({ [field]: value });
  } else {
    // Update only the field passed
    policy[field] = value;
  }

  await policy.save();
  return policy;
};

const getPrivecy = async (field?: PolicyField) => {
  if (field && !["term", "privacy"].includes(field)) {
    throw new AppError(500, "Field must be either 'term' or 'privery'");
  }

  const policy = await Policy.findOne();
  if (!policy) return null;

  if (field === "term") return { term: policy.term };
  if (field === "privacy") return { privery: policy.privacy };
  return { term: policy.term, privery: policy.privacy };
};

export const PrivecyService = {
  upsertPolicy,
  getPrivecy,
};
