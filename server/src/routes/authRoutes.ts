import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { handleImputErrors } from "../middleware/validation";
import { forgotPasswordValidation, loginValidation } from "../validation/auth";

const router = Router();

router.post("/login", loginValidation, handleImputErrors, AuthController.login);
router.post("/forgot-password", forgotPasswordValidation, handleImputErrors, AuthController.forgotPassword);

export default router;
