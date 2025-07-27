/* eslint-disable @typescript-eslint/no-unused-vars */
import status from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { AuthService } from "./auth.service";
import { appConfig } from "../../config";
import logger from "../../utils/logger";
import { TUserRole } from "../../interface/auth.interface";

const createUser = catchAsync(async (req, res) => {
  const { role, ...other } = req.body;
  const result = await AuthService.createUser(other, role as TUserRole);

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "User successfully created.Check your email for code.",
    data: result,
  });
});

const userLogin = catchAsync(async (req, res, next) => {
  const result = await AuthService.userLogin(req.body);

  res.cookie("refreshToken", `Bearer ${result.refreshToken}`, {
    secure: appConfig.server.node_env === "production",
    httpOnly: true,
  });

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "User login successfull",
    data: result,
  });
});

const verifyUser = catchAsync(async (req, res, next) => {
  const { email, otp } = req.body;

  const result = await AuthService.verifyUser(email, otp);

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Verification Successfull.",
    data: result,
  });
});

const forgotPasswordRequest = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  const result = await AuthService.forgotPasswordRequest(email);

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "A verification code is sent to your email.",
    data: result,
  });
});

const verifyUserResetPass = catchAsync(async (req, res, next) => {
  const { email, otp } = req.body;

  const result = await AuthService.verifyUserResetPass(email, otp);

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Verification Successfull.",
    data: result,
  });
});

const resetPassword = catchAsync(async (req, res, next) => {
  const tokenWithBearer = req.headers.authorization as string;
  const token = tokenWithBearer.split(" ")[1];

  const result = await AuthService.resetPassword(token as string, req.body);

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Password reset successfully",
    data: result,
  });
});

const getNewAccessToken = catchAsync(async (req, res) => {
  const refreshToken =
    req.cookies.refreshToken || (req.headers.authorization as string);

  const result = await AuthService.getNewAccessToken(refreshToken);
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: status.OK,
    message: "New access-token is created.",
  });
});

const updatePassword = catchAsync(async (req, res) => {
  const { userId } = req.user;

  const result = await AuthService.updatePassword(userId, req.body);
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: status.OK,
    message: "Password successfully updated",
  });
});

const reSendOtp = catchAsync(async (req, res) => {
  const { email } = req.body;
  const result = await AuthService.reSendOtp(email);
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: status.OK,
    message: "Verification Code send successfully",
  });
});

export const AuthController = {
  createUser,
  verifyUser,
  forgotPasswordRequest,
  resetPassword,
  userLogin,
  getNewAccessToken,
  updatePassword,
  reSendOtp,
  verifyUserResetPass,
};
