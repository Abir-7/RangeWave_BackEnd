/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";
import AppError from "../../errors/AppError";
import status from "http-status";
import { TUserRole } from "../../interface/auth.interface";

import { jsonWebToken } from "../../utils/jwt/jwt";
import { appConfig } from "../../config";
import User from "../../modules/users/user/user.model";
import logger from "../../utils/logger";

export const auth =
  (...userRole: TUserRole[]) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tokenWithBearer = req.headers.authorization as string;

      if (!tokenWithBearer || !tokenWithBearer.startsWith("Bearer")) {
        return next(
          new AppError(status.UNAUTHORIZED, "You are not authorized")
        );
      }

      const token = tokenWithBearer.split(" ")[1];

      if (token === "null") {
        return next(
          new AppError(status.UNAUTHORIZED, "You are not authorized")
        );
      }
      logger.info("token given");
      console.log(token);
      const decodedData = jsonWebToken.verifyJwt(
        token.trim(),
        appConfig.jwt.jwt_access_secret as string
      );

      console.log(decodedData);
      logger.info(`token decoded.${decodedData.userId}`);
      const userData = await User.findById({ _id: decodedData.userId });

      if (!userData) {
        return next(
          new AppError(status.UNAUTHORIZED, "You are not authorized")
        );
      }
      logger.info("user data found");

      if (!userData.isVerified) {
        return next(
          new AppError(status.UNAUTHORIZED, "You are not authorized")
        );
      }
      logger.info("user is verified");
      if (userRole.length && !userRole.includes(decodedData.userRole)) {
        return next(
          new AppError(status.UNAUTHORIZED, "You are not authorized")
        );
      }
      logger.info("role included");
      if (
        userData.role !== decodedData.userRole ||
        userData.email !== decodedData.userEmail
      ) {
        return next(
          new AppError(status.UNAUTHORIZED, "You are not authorized")
        );
      }
      logger.info("role matched. auth ok");
      req.user = decodedData;

      return next();
    } catch (error) {
      return next(
        new AppError(status.UNAUTHORIZED, "Invalid or expired token")
      );
    }
  };
