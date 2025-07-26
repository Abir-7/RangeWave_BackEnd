/* eslint-disable @typescript-eslint/no-explicit-any */
import status from "http-status";
import AppError from "../../errors/AppError";
import User from "../users/user/user.model";

import { jsonWebToken } from "../../utils/jwt/jwt";

import getExpiryTime from "../../utils/helper/getExpiryTime";
import getOtp from "../../utils/helper/getOtp";
import { sendEmail } from "../../utils/sendEmail";
import getHashedPassword from "../../utils/helper/getHashedPassword";
import { appConfig } from "../../config";
import { jwtDecode } from "jwt-decode";

import { MechanicProfile } from "../users/mechanicProfile/mechanicProfile.model";
import { startSession } from "mongoose";
import { IUser } from "../users/user/user.interface";
import { TUserRole } from "../../interface/auth.interface";

import { UserProfile } from "../users/userProfile/userProfile.model";
import { publishJob } from "../../rabbitMq/publisher";

const createUser = async (
  data: {
    email: string;
    fullName: string;
    password: string;
  },
  role: TUserRole
): Promise<Partial<IUser>> => {
  if (!role) {
    throw new AppError(status.BAD_REQUEST, "User role is required.");
  }
  let isExist: any;
  isExist = await User.findOne({ email: data.email });

  if (isExist?.isVerified === false) {
    await User.findOneAndDelete({ email: isExist.email });

    if (role === "MECHANIC") {
      await MechanicProfile.findOneAndDelete({ email: isExist.email });
    }
    if (role === "USER") {
      await UserProfile.findOneAndDelete({ email: isExist.email });
    }

    isExist = null;
  }

  if (isExist) {
    throw new AppError(status.BAD_REQUEST, "Email already Exist");
  }

  const session = await startSession(); // Start a session for the transaction
  session.startTransaction(); // Begin the transaction

  try {
    const hashedPassword = await getHashedPassword(data.password);
    const otp = getOtp(4);
    const expDate = getExpiryTime(10);

    // User data
    const userData = {
      email: data.email,
      password: hashedPassword,
      authentication: { otp: 1111, expDate },
    };

    // Create user
    const createdUser = await User.create([{ ...userData, role }], { session });

    // User profile data
    const userProfileData = {
      fullName: data.fullName,
      email: createdUser[0].email,
      user: createdUser[0]._id,
    };

    // Create profile based on the role
    if (role === "USER") {
      await UserProfile.create([userProfileData], { session });
    }
    if (role === "MECHANIC") {
      await MechanicProfile.create([userProfileData], { session });
    }

    // Send email verification
    // await sendEmail(
    //   data.email,
    //   "Email Verification Code",
    //   `Your code is: ${otp}`
    // );

    await publishJob("emailQueue", {
      to: data.email,
      subject: "Email Verification Code",
      body: otp.toString(),
    });

    // await emailQueue.add("send-verification-email", {
    //   email: data.email,
    //   subject: "Email Verification Code",
    //   text: `Your code is: ${otp}`,
    // });

    // Commit the transaction
    await session.commitTransaction();
    session.endSession(); // End the session

    return {
      email: createdUser[0].email,
      isVerified: createdUser[0].isVerified,
    };
  } catch (error: any) {
    // If any error occurs, abort the transaction
    await session.abortTransaction();
    session.endSession(); // End the session

    // Rethrow the error so the caller can handle it
    throw new AppError(status.INTERNAL_SERVER_ERROR, error);
  }
};

const userLogin = async (loginData: {
  email: string;
  password: string;
}): Promise<{
  accessToken: string;
  userData: any;
  refreshToken: string;
  decodedData: object;
}> => {
  const userData = await User.findOne({ email: loginData.email }).select(
    "+password"
  );
  if (!userData) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  if (userData.isVerified === false) {
    throw new AppError(status.BAD_REQUEST, "Please verify your email.");
  }

  const isPassMatch = await userData.comparePassword(loginData.password);

  if (!isPassMatch) {
    throw new AppError(status.BAD_REQUEST, "Please check your password.");
  }

  let isInfoGiven = false;

  if (userData.role === "USER") {
    const userProfileData = await UserProfile.findOne({
      user: userData._id,
    });

    if (!userProfileData) {
      throw new AppError(status.NOT_FOUND, "User profile not found");
    }

    if (userProfileData.carInfo.carName && userProfileData.carInfo.carModel) {
      isInfoGiven = true;
    }
  }

  if (userData.role === "MECHANIC") {
    const mechanicProfileData = await MechanicProfile.findOne({
      user: userData._id,
    });

    if (!mechanicProfileData) {
      throw new AppError(status.NOT_FOUND, "User profile not found");
    }

    if (
      mechanicProfileData.workshop.name &&
      mechanicProfileData.workshop.services
    ) {
      isInfoGiven = true;
    }
  }

  const jwtPayload = {
    userEmail: userData.email,
    userId: userData._id,
    userRole: userData.role,
  };

  const accessToken = jsonWebToken.generateToken(
    jwtPayload,
    appConfig.jwt.jwt_access_secret as string,
    appConfig.jwt.jwt_access_exprire
  );

  const refreshToken = jsonWebToken.generateToken(
    jwtPayload,
    appConfig.jwt.jwt_refresh_secret as string,
    appConfig.jwt.jwt_refresh_exprire
  );

  const decodedData = jwtDecode(accessToken);

  return {
    accessToken,
    decodedData: {
      ...decodedData,
      iat: (decodedData.iat ?? 0) * 1000,
      exp: (decodedData.exp ?? 0) * 1000,
    },
    refreshToken,
    userData: {
      ...userData.toObject(),
      password: null,
      ...(userData.role !== "ADMIN" ? { isInfoGiven } : {}),
    },
  };
};

const verifyUser = async (
  email: string,
  otp: number
): Promise<{
  userId: string | undefined;
  email: string | undefined;
  isVerified: boolean | undefined;
  needToResetPass: boolean | undefined;
  accessToken: string | null;
  decodedData: object;
  refreshToken: string;
}> => {
  if (!otp) {
    throw new AppError(status.BAD_REQUEST, "Give the Code. Check your email.");
  }
  const user = await User.findOne({ email });

  if (!user) {
    throw new AppError(status.BAD_REQUEST, "User not found");
  }

  const currentDate = new Date();
  const expirationDate = new Date(user.authentication.expDate);

  if (currentDate > expirationDate) {
    throw new AppError(status.BAD_REQUEST, "Code time expired.");
  }

  if (otp !== user.authentication.otp) {
    throw new AppError(status.BAD_REQUEST, "Code not matched.");
  }
  let refreshToken = "";
  let updatedUser;
  let token = null;
  if (user.isVerified) {
    token = jsonWebToken.generateToken(
      { userEmail: user.email, userId: user._id, userRole: user.role },
      appConfig.jwt.jwt_access_secret as string,
      "10m"
    );

    const expDate = getExpiryTime(10);

    updatedUser = await User.findOneAndUpdate(
      { email: user.email },
      {
        "authentication.otp": null,
        "authentication.expDate": expDate,
        needToResetPass: true,
        "authentication.token": token,
      },
      { new: true }
    );
  } else {
    token = jsonWebToken.generateToken(
      { userEmail: user.email, userId: user._id, userRole: user.role },
      appConfig.jwt.jwt_access_secret as string,
      appConfig.jwt.jwt_access_exprire
    );
    refreshToken = jsonWebToken.generateToken(
      { userEmail: user.email, userId: user._id, userRole: user.role },
      appConfig.jwt.jwt_refresh_secret as string,
      appConfig.jwt.jwt_refresh_exprire
    );
    updatedUser = await User.findOneAndUpdate(
      { email: user.email },
      {
        "authentication.otp": null,
        "authentication.expDate": null,
        isVerified: true,
      },
      { new: true }
    );
  }

  const decodedData = jwtDecode(token);

  return {
    userId: updatedUser?._id as string,
    email: updatedUser?.email,
    isVerified: updatedUser?.isVerified,
    needToResetPass: updatedUser?.needToResetPass,
    accessToken: token,
    refreshToken: refreshToken,
    decodedData: {
      ...decodedData,
      iat: (decodedData.iat ?? 0) * 1000,
      exp: (decodedData.exp ?? 0) * 1000,
    },
  };
};

const forgotPasswordRequest = async (
  email: string
): Promise<{ email: string }> => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError(status.BAD_REQUEST, "Email not found.");
  }

  const otp = getOtp(4);
  const expDate = getExpiryTime(10);

  const data = {
    otp: otp,
    expDate: expDate,
    needToResetPass: false,
    token: null,
  };

  await sendEmail(
    user.email,
    "Reset Password Verification Code",
    `Your code is: ${otp}`
  );

  await User.findOneAndUpdate(
    { email },
    { authentication: data },
    { new: true }
  );

  return { email: user.email };
};

const resetPassword = async (
  token: string,
  userData: {
    new_password: string;
    confirm_password: string;
  }
): Promise<{ email: string }> => {
  const { new_password, confirm_password } = userData;

  if (!token) {
    throw new AppError(
      status.BAD_REQUEST,
      "You are not allowed to reset password."
    );
  }

  const user = await User.findOne({ "authentication.token": token });
  if (!user) {
    throw new AppError(status.BAD_REQUEST, "User not found.");
  }

  const currentDate = new Date();
  const expirationDate = new Date(user.authentication.expDate);

  if (currentDate > expirationDate) {
    throw new AppError(status.BAD_REQUEST, "Token expired.");
  }

  if (new_password !== confirm_password) {
    throw new AppError(
      status.BAD_REQUEST,
      "New password and Confirm password doesn't match!"
    );
  }

  const decode = jsonWebToken.verifyJwt(
    token,
    appConfig.jwt.jwt_access_secret as string
  );

  const hassedPassword = await getHashedPassword(new_password);

  const updateData = await User.findOneAndUpdate(
    { email: decode.userEmail },
    {
      password: hassedPassword,
      authentication: { otp: null, token: null, expDate: null },
      needToResetPass: false,
    },
    { new: true }
  );
  if (!updateData) {
    throw new AppError(
      status.BAD_REQUEST,
      "Failed to reset password. Try again."
    );
  }
  return { email: updateData?.email as string };
};

const getNewAccessToken = async (
  tokenWithBearer: string
): Promise<{ accessToken: string; decodedData: object }> => {
  if (!tokenWithBearer || !tokenWithBearer.startsWith("Bearer")) {
    throw new AppError(status.UNAUTHORIZED, "You are not authorized");
  }
  const refreshToken = tokenWithBearer.split(" ")[1];
  if (!refreshToken) {
    throw new AppError(status.UNAUTHORIZED, "Refresh token not found.");
  }
  const decode = jsonWebToken.verifyJwt(
    refreshToken,
    appConfig.jwt.jwt_refresh_secret as string
  );

  const { userEmail, userId, userRole } = decode;

  if (userEmail && userId && userRole) {
    const jwtPayload = {
      userEmail: userEmail,
      userId: userId,
      userRole: userRole,
    };

    const accessToken = jsonWebToken.generateToken(
      jwtPayload,
      appConfig.jwt.jwt_access_secret as string,
      appConfig.jwt.jwt_access_exprire
    );

    const decodedData = jwtDecode(accessToken);
    return {
      accessToken,
      decodedData: {
        ...decodedData,
        iat: (decodedData.iat ?? 0) * 1000,
        exp: (decodedData.exp ?? 0) * 1000,
      },
    };
  } else {
    throw new AppError(status.UNAUTHORIZED, "You are unauthorized.");
  }
};

const updatePassword = async (
  userId: string,
  passData: {
    new_password: string;
    confirm_password: string;
    old_password: string;
  }
): Promise<{ message: string; user: string }> => {
  const { new_password, confirm_password, old_password } = passData;

  const user = await User.findById(userId).select("+password");
  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found.");
  }

  const isPassMatch = await user.comparePassword(old_password);

  if (!isPassMatch) {
    throw new AppError(status.BAD_REQUEST, "Old password not matched.");
  }

  if (new_password !== confirm_password) {
    throw new AppError(
      status.BAD_REQUEST,
      "New password and Confirm password doesn't match!"
    );
  }

  const hassedPassword = await getHashedPassword(new_password);

  if (!hassedPassword) {
    throw new AppError(
      status.BAD_REQUEST,
      "Failed to update password. Try again."
    );
  }

  user.password = hassedPassword;
  await user.save();

  return { user: user.email, message: "Password successfully updated." };
};

const reSendOtp = async (userEmail: string) => {
  const OTP = getOtp(4);

  const updateUser = await User.findOneAndUpdate(
    { email: userEmail },
    {
      $set: {
        "authentication.otp": OTP,
        "authentication.expDate": new Date(Date.now() + 10 * 60 * 1000), //10min
      },
    },
    { new: true }
  );

  if (!updateUser) {
    throw new AppError(500, "Failed to Send. Try Again!");
  }

  await sendEmail(userEmail, "Verification Code", `CODE: ${OTP}`);
  return { message: "Verification code send." };
};
export const AuthService = {
  createUser,
  userLogin,
  verifyUser,
  forgotPasswordRequest,
  resetPassword,
  getNewAccessToken,
  updatePassword,
  reSendOtp,
};
