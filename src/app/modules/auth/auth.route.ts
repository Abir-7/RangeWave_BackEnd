import { Router } from "express";
import { AuthController } from "./auth.controller";
import { auth } from "../../middleware/auth/auth";
import zodValidator from "../../middleware/zodValidator";
import { zodCreateUserSchema } from "../users/user/user.validation";

const router = Router();

router.post(
  "/signup",
  zodValidator(zodCreateUserSchema),
  AuthController.createUser
);

router.get("/get-access-token", AuthController.getNewAccessToken);

router.post("/login", AuthController.userLogin);

router.patch("/verify-user", AuthController.verifyUser);
router.patch("/forgot-password-request", AuthController.forgotPasswordRequest);
router.patch("/reset-password", AuthController.resetPassword);
router.patch("/update-password", auth("USER"), AuthController.updatePassword);
router.patch("/resend-code", AuthController.reSendOtp);

export const AuthRoute = router;
