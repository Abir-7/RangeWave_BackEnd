import status from "http-status";
import sendResponse from "../../../utils/sendResponse";

import catchAsync from "../../../utils/catchAsync";
import { MechanicProfileService } from "./mechanicProfile.service";

const updateMechanicProfile = catchAsync(async (req, res) => {
  const userData = req.body;

  const result = await MechanicProfileService.updateMechanicProfile(
    req.user.userEmail,
    userData
  );
  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: " Mechanic Profile info updated successfully.",
    data: result,
  });
});

export const MechanicProfileController = { updateMechanicProfile };
