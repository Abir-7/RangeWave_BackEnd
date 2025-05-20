import status from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { UserService } from "./user.service";

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

const getProfileData = catchAsync(async (req, res) => {
  const result = await UserService.getProfileData(req.user.userId);
  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Profile data fetched successfully.",
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
  updateProfileImage,
  getProfileData,
};
