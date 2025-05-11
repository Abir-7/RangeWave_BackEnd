import status from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { UserService } from "./user.service";
import { TUserRole } from "../../../interface/auth.interface";

const createUser = catchAsync(async (req, res) => {
  const role = req.query.role;
  const userData = req.body;
  const result = await UserService.createUser(userData, role as TUserRole);

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "User successfully created.Check your email for code.",
    data: result,
  });
});

const updateProfileImage = catchAsync(async (req, res) => {
  const filePath = req.file?.path;

  const result = await UserService.updateProfileImage(
    filePath as string,
    req.user.userEmail
  );
  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Profile image changed successfully.",
    data: result,
  });
});

//   const userData = req.body;

//   const result = await UserService.updateProfileData(
//     userData,
//     req.user.userEmail
//   );
//   sendResponse(res, {
//     success: true,
//     statusCode: status.OK,
//     message: "Profile info updated successfully.",
//     data: result,
//   });
// });

export const UserController = {
  createUser,
  updateProfileImage,
};
