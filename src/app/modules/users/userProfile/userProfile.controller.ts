import status from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { UserProfileService } from "./userProfile.service";

const updateUserProfile = catchAsync(async (req, res) => {
  const userData = req.body;

  const result = await UserProfileService.updateUserProfile(
    req.user.userEmail,
    userData
  );
  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: " User Profile info updated successfully.",
    data: result,
  });
});
//
export const UserProfileController = { updateUserProfile };
