/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
// services/car.service.ts

import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { Car } from "./carModel.interface.model";
import { CarIssue, UserCarIssue } from "../carIssue/carIssuse.model";
import logger from "../../utils/logger";

export const getCarsData = catchAsync(async (req: Request, res: Response) => {
  const result = await getCars(req.query.searchTerm as string);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Car data fetched.",
    data: result,
  });
});

export const getCars = async (search: string = "") => {
  const query: Record<string, any> = {};

  if (search) {
    query.model = { $regex: search, $options: "i" }; // case-insensitive search
  }

  const cars = await Car.find(query).limit(20).lean();

  return cars.map((c) => c.model);
};

export const getCarsIssue = catchAsync(async (req: Request, res: Response) => {
  const result = await findCarIssues(
    req.user.userId,
    req.query.searchTerm as string
  );
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Car issue data fetched.",
    data: result,
  });
});

// const findCarIssues = async (searchTerm: string = "", limit: number = 30) => {
//   try {
//     // Build a case-insensitive regex for search
//     const regex = new RegExp(searchTerm, "i");

//     const issues = await CarIssue.find({ name: { $regex: regex } })
//       .limit(limit)
//       .exec();

//     return issues.map((issue) => issue.name);
//   } catch (error) {
//     console.error("❌ Error finding car issues:", error);
//     throw error;
//   }
// };
const findCarIssues = async (
  userId: string,
  searchTerm: string = "",
  limit: number = 30
) => {
  try {
    const regex = new RegExp(searchTerm, "i");
    const halfLimit = Math.floor(limit / 2);

    // Fetch user-specific issues first
    const userIssuesPromise = UserCarIssue.find({
      user: userId,
      name: { $regex: regex },
    })
      .sort({ name: 1 })
      .limit(halfLimit)
      .lean();

    // Fetch global issues next
    const globalIssuesPromise = CarIssue.find({
      name: { $regex: regex },
    })
      .sort({ name: 1 })
      .limit(halfLimit)
      .lean();

    const [userIssues, globalIssues] = await Promise.all([
      userIssuesPromise,
      globalIssuesPromise,
    ]);

    // Extract names
    const userNames = userIssues.map((i) => i.name);
    const globalNames = globalIssues.map((i) => i.name);

    // Merge user first, then global, remove duplicates (case-insensitive)
    const result: string[] = [];
    const seen = new Set<string>();

    for (const name of [...userNames, ...globalNames]) {
      const lower = name.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        result.push(name);
      }
    }

    return result.slice(0, limit);
  } catch (error) {
    logger.error("❌ Error finding car issues:", error);
    throw error;
  }
};
