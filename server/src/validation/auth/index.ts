import { body } from "express-validator";

export const loginValidation = [
  body("email").notEmpty().withMessage("El email es obligatorio").isEmail().withMessage("El email no es válido").normalizeEmail(),
  body("password").notEmpty().withMessage("La contraseña es obligatoria").isString().withMessage("La contraseña no es válida"),
];

export const forgotPasswordValidation = [
  body("email").notEmpty().withMessage("El email es obligatorio").isEmail().withMessage("El email no es válido").normalizeEmail(),
];
