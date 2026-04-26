import { Router } from "express";
import { authController } from "./auth.controller";
import { validate } from "../../core/middlewares/validate.middleware";
import * as schemas from "./auth.schema";

const router = Router();

router.post("/login", validate(schemas.loginSchema), authController.login);
router.post("/verify-otp", validate(schemas.verifyOtpSchema), authController.verifyOtp);
router.post("/refresh", validate(schemas.refreshSchema), authController.refresh);
router.post("/logout", validate(schemas.logoutSchema), authController.logout);

export default router;
