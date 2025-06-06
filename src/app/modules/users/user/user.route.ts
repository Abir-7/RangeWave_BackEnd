import { Router } from "express";
import { UserController } from "./user.controller";

import { upload } from "../../../middleware/fileUpload/fileUploadHandler";
import { auth } from "../../../middleware/auth/auth";

const router = Router();

router.patch(
  "/update-profile-image",
  auth("ADMIN", "USER", "MECHANIC"),
  upload.single("image"),
  UserController.updateProfileImage
);

router.get(
  "/me",
  auth("ADMIN", "MECHANIC", "USER"),
  UserController.getProfileData
);

export const UserRoute = router;
