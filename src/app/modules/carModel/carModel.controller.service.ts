/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
// services/car.service.ts

import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { Car } from "./carModel.interface.model";

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
