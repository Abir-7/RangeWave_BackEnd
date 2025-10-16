"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const user_model_1 = __importDefault(require("../users/user/user.model"));
const jwt_1 = require("../../utils/jwt/jwt");
const getExpiryTime_1 = __importDefault(require("../../utils/helper/getExpiryTime"));
const getOtp_1 = __importDefault(require("../../utils/helper/getOtp"));
const getHashedPassword_1 = __importDefault(require("../../utils/helper/getHashedPassword"));
const config_1 = require("../../config");
const jwt_decode_1 = require("jwt-decode");
const mechanicProfile_model_1 = require("../users/mechanicProfile/mechanicProfile.model");
const mongoose_1 = require("mongoose");
const userProfile_model_1 = require("../users/userProfile/userProfile.model");
const publisher_1 = require("../../rabbitMq/publisher");
const logger_1 = __importDefault(require("../../utils/logger"));
const createUser = (data, role) => __awaiter(void 0, void 0, void 0, function* () {
    if (!role) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "User role is required.");
    }
    let isExist;
    isExist = yield user_model_1.default.findOne({ email: data.email.toLowerCase() });
    if ((isExist === null || isExist === void 0 ? void 0 : isExist.isVerified) === false) {
        yield user_model_1.default.findOneAndDelete({ email: isExist.email });
        if (role === "MECHANIC") {
            yield mechanicProfile_model_1.MechanicProfile.findOneAndDelete({ email: isExist.email });
        }
        if (role === "USER") {
            yield userProfile_model_1.UserProfile.findOneAndDelete({ email: isExist.email });
        }
        isExist = null;
    }
    if (isExist) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "An account already created with this email.");
    }
    const session = yield (0, mongoose_1.startSession)(); // Start a session for the transaction
    session.startTransaction(); // Begin the transaction
    try {
        const hashedPassword = yield (0, getHashedPassword_1.default)(data.password);
        const otp = (0, getOtp_1.default)(4);
        const expDate = (0, getExpiryTime_1.default)(10);
        // User data
        const userData = {
            email: data.email.toLowerCase(),
            password: hashedPassword,
            authentication: { otp: otp, expDate },
        };
        // Create user
        const createdUser = yield user_model_1.default.create([Object.assign(Object.assign({}, userData), { role })], { session });
        // User profile data
        const userProfileData = {
            fullName: data.fullName,
            email: createdUser[0].email,
            user: createdUser[0]._id,
        };
        // Create profile based on the role
        if (role === "USER") {
            yield userProfile_model_1.UserProfile.create([userProfileData], { session });
        }
        if (role === "MECHANIC") {
            yield mechanicProfile_model_1.MechanicProfile.create([userProfileData], { session });
        }
        yield (0, publisher_1.publishJob)("emailQueue", {
            to: data.email,
            subject: "Email Verification Code",
            body: otp.toString(),
        });
        // Commit the transaction
        yield session.commitTransaction();
        session.endSession(); // End the session
        return {
            email: createdUser[0].email,
            isVerified: createdUser[0].isVerified,
        };
    }
    catch (error) {
        // If any error occurs, abort the transaction
        yield session.abortTransaction();
        session.endSession(); // End the session
        // Rethrow the error so the caller can handle it
        throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, error);
    }
});
const userLogin = (loginData) => __awaiter(void 0, void 0, void 0, function* () {
    // 1. Find user
    var _a, _b, _c, _d, _e, _f, _g;
    const user = yield user_model_1.default.findOne({
        email: loginData.email.toLowerCase(),
    }).select("+password");
    if (!user)
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found");
    if (user.role !== "ADMIN") {
        if (!loginData.role) {
            throw new Error("User role not provided.");
        }
        if (user.role !== loginData.role) {
            throw new AppError_1.default(500, `${loginData.role === "USER"
                ? "This account is registered as a mechanic and can't login as a customer"
                : "This account is registered as a customer  and can't login as a mechanic"}`);
        }
    }
    // 2. Check verification
    if (!user.isVerified)
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Please verify your email.");
    // 3. Check password
    const isPassMatch = yield user.comparePassword(loginData.password);
    if (!isPassMatch)
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Please check your password.");
    // 4. Check profile completeness (only for USER / MECHANIC)
    let isInfoGiven = false;
    if (user.role === "USER") {
        const profile = yield userProfile_model_1.UserProfile.findOne({ user: user._id });
        if (!profile)
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User profile not found");
        isInfoGiven = Boolean(((_a = profile === null || profile === void 0 ? void 0 : profile.carInfo) === null || _a === void 0 ? void 0 : _a.carName) && ((_b = profile === null || profile === void 0 ? void 0 : profile.carInfo) === null || _b === void 0 ? void 0 : _b.carModel));
    }
    else if (user.role === "MECHANIC") {
        const profile = yield mechanicProfile_model_1.MechanicProfile.findOne({ user: user._id });
        if (!profile)
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User profile not found");
        isInfoGiven = Boolean(((_c = profile === null || profile === void 0 ? void 0 : profile.workshop) === null || _c === void 0 ? void 0 : _c.name) && ((_e = (_d = profile === null || profile === void 0 ? void 0 : profile.workshop) === null || _d === void 0 ? void 0 : _d.services) === null || _e === void 0 ? void 0 : _e.length));
    }
    // 5. Prepare JWT payload
    const jwtPayload = {
        userEmail: user.email,
        userId: user._id,
        userRole: user.role,
    };
    // 6. Generate tokens
    const accessToken = jwt_1.jsonWebToken.generateToken(jwtPayload, config_1.appConfig.jwt.jwt_access_secret, config_1.appConfig.jwt.jwt_access_exprire);
    const refreshToken = jwt_1.jsonWebToken.generateToken(jwtPayload, config_1.appConfig.jwt.jwt_refresh_secret, config_1.appConfig.jwt.jwt_refresh_exprire);
    const decodedData = (0, jwt_decode_1.jwtDecode)(accessToken);
    // 7. Return safe response
    return {
        accessToken,
        refreshToken,
        decodedData: Object.assign(Object.assign({}, decodedData), { iat: ((_f = decodedData.iat) !== null && _f !== void 0 ? _f : 0) * 1000, exp: ((_g = decodedData.exp) !== null && _g !== void 0 ? _g : 0) * 1000 }),
        userData: Object.assign(Object.assign(Object.assign({}, user.toObject()), { password: undefined }), (user.role !== "ADMIN" ? { isInfoGiven } : {})),
    };
});
const verifyUser = (email, otp) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    logger_1.default.info("hit--2--");
    if (!otp) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Please provide the code. Check your email.");
    }
    const user = yield user_model_1.default.findOne({ email: email.toLowerCase() });
    if (!user) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "User not found");
    }
    const currentDate = new Date();
    const expirationDate = new Date(user.authentication.expDate);
    if (currentDate > expirationDate) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Code time expired.");
    }
    if (otp !== user.authentication.otp) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Code not matched.");
    }
    let refreshToken = "";
    let token = null;
    token = jwt_1.jsonWebToken.generateToken({ userEmail: user.email, userId: user._id, userRole: user.role }, config_1.appConfig.jwt.jwt_access_secret, config_1.appConfig.jwt.jwt_access_exprire);
    refreshToken = jwt_1.jsonWebToken.generateToken({ userEmail: user.email, userId: user._id, userRole: user.role }, config_1.appConfig.jwt.jwt_refresh_secret, config_1.appConfig.jwt.jwt_refresh_exprire);
    const updatedUser = yield user_model_1.default.findOneAndUpdate({ email: user.email }, {
        "authentication.otp": null,
        "authentication.expDate": null,
        isVerified: true,
    }, { new: true });
    const decodedData = (0, jwt_decode_1.jwtDecode)(token);
    return {
        userId: updatedUser === null || updatedUser === void 0 ? void 0 : updatedUser._id,
        email: updatedUser === null || updatedUser === void 0 ? void 0 : updatedUser.email,
        isVerified: updatedUser === null || updatedUser === void 0 ? void 0 : updatedUser.isVerified,
        needToResetPass: updatedUser === null || updatedUser === void 0 ? void 0 : updatedUser.needToResetPass,
        accessToken: token,
        refreshToken: refreshToken,
        decodedData: Object.assign(Object.assign({}, decodedData), { iat: ((_a = decodedData.iat) !== null && _a !== void 0 ? _a : 0) * 1000, exp: ((_b = decodedData.exp) !== null && _b !== void 0 ? _b : 0) * 1000 }),
    };
});
const forgotPasswordRequest = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.default.findOne({ email: email.toLowerCase() });
    if (!user) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Email not found.");
    }
    const otp = (0, getOtp_1.default)(4);
    const expDate = (0, getExpiryTime_1.default)(10);
    const data = {
        otp: otp,
        expDate: expDate,
        needToResetPass: false,
        token: null,
    };
    yield (0, publisher_1.publishJob)("emailQueue", {
        to: user.email,
        subject: "Reset Password Verification Code",
        body: otp.toString(),
    });
    yield user_model_1.default.findOneAndUpdate({ email }, { authentication: data }, { new: true });
    return { email: user.email };
});
const verifyUserResetPass = (email, otp) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    logger_1.default.info("hit----");
    if (!otp) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Please Provide the otp. Check your email.");
    }
    const user = yield user_model_1.default.findOne({ email: email.toLowerCase() });
    if (!user) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "User not found");
    }
    const currentDate = new Date();
    const expirationDate = new Date(user.authentication.expDate);
    if (currentDate > expirationDate) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Code time expired.");
    }
    if (otp !== user.authentication.otp) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Code not matched.");
    }
    let token = null;
    token = jwt_1.jsonWebToken.generateToken({ userEmail: user.email, userId: user._id, userRole: user.role }, config_1.appConfig.jwt.jwt_access_secret, "10m");
    const expDate = (0, getExpiryTime_1.default)(10);
    const updatedUser = yield user_model_1.default.findOneAndUpdate({ email: user.email }, {
        "authentication.otp": null,
        "authentication.expDate": expDate,
        needToResetPass: true,
        "authentication.token": token,
    }, { new: true });
    const decodedData = (0, jwt_decode_1.jwtDecode)(token);
    return {
        userId: updatedUser === null || updatedUser === void 0 ? void 0 : updatedUser._id,
        email: updatedUser === null || updatedUser === void 0 ? void 0 : updatedUser.email,
        isVerified: updatedUser === null || updatedUser === void 0 ? void 0 : updatedUser.isVerified,
        needToResetPass: updatedUser === null || updatedUser === void 0 ? void 0 : updatedUser.needToResetPass,
        accessToken: token,
        refreshToken: "",
        decodedData: Object.assign(Object.assign({}, decodedData), { iat: ((_a = decodedData.iat) !== null && _a !== void 0 ? _a : 0) * 1000, exp: ((_b = decodedData.exp) !== null && _b !== void 0 ? _b : 0) * 1000 }),
    };
});
const resetPassword = (token, userData) => __awaiter(void 0, void 0, void 0, function* () {
    const { new_password, confirm_password } = userData;
    if (!token) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "You are not allowed to reset password.");
    }
    const user = yield user_model_1.default.findOne({ "authentication.token": token });
    if (!user) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "User not found.");
    }
    const currentDate = new Date();
    const expirationDate = new Date(user.authentication.expDate);
    if (currentDate > expirationDate) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Token expired.");
    }
    if (new_password !== confirm_password) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "New password and Confirm password doesn't match!");
    }
    const decode = jwt_1.jsonWebToken.verifyJwt(token, config_1.appConfig.jwt.jwt_access_secret);
    const hassedPassword = yield (0, getHashedPassword_1.default)(new_password);
    const updateData = yield user_model_1.default.findOneAndUpdate({ email: decode.userEmail }, {
        password: hassedPassword,
        authentication: { otp: null, token: null, expDate: null },
        needToResetPass: false,
    }, { new: true });
    if (!updateData) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Failed to reset password. Try again.");
    }
    return { email: updateData === null || updateData === void 0 ? void 0 : updateData.email };
});
const getNewAccessToken = (tokenWithBearer) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    if (!tokenWithBearer || !tokenWithBearer.startsWith("Bearer")) {
        throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, "You are not authorized");
    }
    const refreshToken = tokenWithBearer.split(" ")[1];
    if (!refreshToken) {
        throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, "Refresh token not found.");
    }
    const decode = jwt_1.jsonWebToken.verifyJwt(refreshToken, config_1.appConfig.jwt.jwt_refresh_secret);
    const { userEmail, userId, userRole } = decode;
    if (userEmail && userId && userRole) {
        const jwtPayload = {
            userEmail: userEmail,
            userId: userId,
            userRole: userRole,
        };
        const accessToken = jwt_1.jsonWebToken.generateToken(jwtPayload, config_1.appConfig.jwt.jwt_access_secret, config_1.appConfig.jwt.jwt_access_exprire);
        const decodedData = (0, jwt_decode_1.jwtDecode)(accessToken);
        return {
            accessToken,
            decodedData: Object.assign(Object.assign({}, decodedData), { iat: ((_a = decodedData.iat) !== null && _a !== void 0 ? _a : 0) * 1000, exp: ((_b = decodedData.exp) !== null && _b !== void 0 ? _b : 0) * 1000 }),
        };
    }
    else {
        throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, "You are unauthorized.");
    }
});
const updatePassword = (userId, passData) => __awaiter(void 0, void 0, void 0, function* () {
    const { new_password, confirm_password, old_password } = passData;
    const user = yield user_model_1.default.findById(userId).select("+password");
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found.");
    }
    const isPassMatch = yield user.comparePassword(old_password);
    if (!isPassMatch) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Old password not matched.");
    }
    if (new_password !== confirm_password) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "New password and Confirm password doesn't match!");
    }
    const hassedPassword = yield (0, getHashedPassword_1.default)(new_password);
    if (!hassedPassword) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Failed to update password. Try again.");
    }
    user.password = hassedPassword;
    yield user.save();
    return { user: user.email, message: "Password successfully updated." };
});
const reSendOtp = (userEmail) => __awaiter(void 0, void 0, void 0, function* () {
    const OTP = (0, getOtp_1.default)(4);
    const userData = yield user_model_1.default.findOne({ email: userEmail.toLowerCase() });
    if (!(userData === null || userData === void 0 ? void 0 : userData.authentication.otp)) {
        throw new AppError_1.default(500, "No previous code found. Can't send new code.");
    }
    // const currentDate = new Date();
    // const expirationDate = new Date(userData.authentication.expDate);
    // if (currentDate < expirationDate) {
    //   throw new AppError(status.BAD_REQUEST, "Use previous code.");
    // }
    const updateUser = yield user_model_1.default.findOneAndUpdate({ email: userEmail.toLowerCase() }, {
        $set: {
            "authentication.otp": OTP,
            "authentication.expDate": new Date(Date.now() + 10 * 60 * 1000), //10min
        },
    }, { new: true });
    if (!updateUser) {
        throw new AppError_1.default(500, "Failed to Send. Try Again!");
    }
    yield (0, publisher_1.publishJob)("emailQueue", {
        to: userEmail.toLowerCase(),
        subject: "Verification Code",
        body: OTP.toString(),
    });
    // await sendEmail(userEmail, "Verification Code", `CODE: ${OTP}`);
    return { message: "Verification code send." };
});
exports.AuthService = {
    createUser,
    userLogin,
    verifyUser,
    forgotPasswordRequest,
    verifyUserResetPass,
    resetPassword,
    getNewAccessToken,
    updatePassword,
    reSendOtp,
};
