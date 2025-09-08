// /* eslint-disable @typescript-eslint/no-explicit-any */
// import mongoose from "mongoose";
// import { appConfig } from "../config";
// import { userRoles } from "../interface/auth.interface";
// import { AdminProfile } from "../modules/users/adminProfile/adminProfile.model";
// import User from "../modules/users/user/user.model";
// import logger from "../utils/logger";
// import getHashedPassword from "../utils/helper/getHashedPassword";

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
import mongoose from "mongoose";
import { appConfig } from "../config";
import { userRoles } from "../interface/auth.interface";
import { AdminProfile } from "../modules/users/adminProfile/adminProfile.model";
import User from "../modules/users/user/user.model";
import logger from "../utils/logger";
import getHashedPassword from "../utils/helper/getHashedPassword";

const superUser = {
  role: userRoles.ADMIN,
  email: appConfig.admin.email,
  password: appConfig.admin.password,
  isVerified: true,
  needToUpdateProfile: false,
};

const superUserProfile = {
  fullName: "Admin-1",
  email: appConfig.admin.email,
};

const seedAdmin = async (): Promise<void> => {
  try {
    // Ensure collections exist before starting a transaction
    await User.init();
    await AdminProfile.init();

    const session = await mongoose.startSession();
    session.startTransaction();

    superUser.password = await getHashedPassword(superUser.password as string);

    try {
      const isExistSuperAdmin = await User.findOne({
        role: userRoles.ADMIN,
        email: superUser.email, // check by email for uniqueness
      }).session(session);

      if (!isExistSuperAdmin) {
        const [createdUser] = await User.create([superUser], { session });
        await AdminProfile.create(
          [{ ...superUserProfile, user: createdUser._id }],
          { session }
        );
        logger.info("Admin Created");
      } else {
        logger.info("Admin already exists");
      }

      await session.commitTransaction();
    } catch (error: any) {
      await session.abortTransaction();
      logger.error("Transaction failed:", error);
    } finally {
      session.endSession();
    }
  } catch (err: any) {
    logger.error("Seed admin failed:", err);
  }
};

export default seedAdmin;
