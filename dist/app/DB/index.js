"use strict";
// /* eslint-disable @typescript-eslint/no-explicit-any */
// import mongoose from "mongoose";
// import { appConfig } from "../config";
// import { userRoles } from "../interface/auth.interface";
// import { AdminProfile } from "../modules/users/adminProfile/adminProfile.model";
// import User from "../modules/users/user/user.model";
// import logger from "../utils/logger";
// import getHashedPassword from "../utils/helper/getHashedPassword";
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
// const superUser = {
//   role: userRoles.ADMIN,
//   email: appConfig.admin.email,
//   password: appConfig.admin.password,
//   isVerified: true,
//   needToUpdateProfile: false,
// };
// const superUserProfile = {
//   fullName: "Admin-1",
//   email: appConfig.admin.email,
// };
// const seedAdmin = async (): Promise<void> => {
//   const session = await mongoose.startSession();
//   session.startTransaction();
//   superUser.password = await getHashedPassword(superUser.password as string);
//   try {
//     const isExistSuperAdmin = await User.findOne({
//       role: userRoles.ADMIN,
//     }).session(session);
//     if (!isExistSuperAdmin) {
//       const data = await User.create([superUser], { session });
//       await AdminProfile.create([{ ...superUserProfile, user: data[0]._id }], {
//         session,
//       });
//       logger.info("Admin Created");
//     } else {
//       logger.info("Admin already created");
//     }
//     await session.commitTransaction();
//     session.endSession();
//   } catch (error: any) {
//     logger.error(error);
//     await session.abortTransaction();
//     session.endSession();
//   }
// };
// export default seedAdmin;
/* eslint-disable @typescript-eslint/no-explicit-any */
const mongoose_1 = __importDefault(require("mongoose"));
const config_1 = require("../config");
const auth_interface_1 = require("../interface/auth.interface");
const adminProfile_model_1 = require("../modules/users/adminProfile/adminProfile.model");
const user_model_1 = __importDefault(require("../modules/users/user/user.model"));
const logger_1 = __importDefault(require("../utils/logger"));
const getHashedPassword_1 = __importDefault(require("../utils/helper/getHashedPassword"));
const superUser = {
    role: auth_interface_1.userRoles.ADMIN,
    email: config_1.appConfig.admin.email,
    password: config_1.appConfig.admin.password,
    isVerified: true,
    needToUpdateProfile: false,
};
const superUserProfile = {
    fullName: "Admin-1",
    email: config_1.appConfig.admin.email,
};
const seedAdmin = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Ensure collections exist before starting a transaction
        yield user_model_1.default.init();
        yield adminProfile_model_1.AdminProfile.init();
        const session = yield mongoose_1.default.startSession();
        session.startTransaction();
        superUser.password = yield (0, getHashedPassword_1.default)(superUser.password);
        try {
            const isExistSuperAdmin = yield user_model_1.default.findOne({
                role: auth_interface_1.userRoles.ADMIN,
                email: superUser.email, // check by email for uniqueness
            }).session(session);
            if (!isExistSuperAdmin) {
                const [createdUser] = yield user_model_1.default.create([superUser], { session });
                yield adminProfile_model_1.AdminProfile.create([Object.assign(Object.assign({}, superUserProfile), { user: createdUser._id })], { session });
                logger_1.default.info("Admin Created");
            }
            else {
                logger_1.default.info("Admin already exists");
            }
            yield session.commitTransaction();
        }
        catch (error) {
            yield session.abortTransaction();
            logger_1.default.error("Transaction failed:", error);
        }
        finally {
            session.endSession();
        }
    }
    catch (err) {
        logger_1.default.error("Seed admin failed:", err);
    }
});
exports.default = seedAdmin;
