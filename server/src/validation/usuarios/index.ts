import { body, param } from "express-validator";

export const idValidationUsuario = [param("idUsuario").isMongoId().withMessage("ID de usuario no válido")];

export const updateValidationUsuario = [
  param("idUsuario").isMongoId().withMessage("ID de usuario no válido"),
  body("name")
    .notEmpty()
    .withMessage("El nombre es obligatorio")
    .isLength({ min: 2, max: 50 })
    .withMessage("El nombre debe tener entre 2 y 50 caracteres")
    .trim()
    .escape(),
  body("lastName")
    .notEmpty()
    .withMessage("El apellido es obligatorio")
    .isLength({ min: 2, max: 50 })
    .withMessage("El apellido debe tener entre 2 y 50 caracteres")
    .trim()
    .escape(),
  body("email").notEmpty().withMessage("El email es obligatorio").isEmail().withMessage("El email no es válido").normalizeEmail(),
  body("role").notEmpty().withMessage("El rol es obligatorio").isIn(["superadmin", "admin", "odontologo"]).withMessage("El rol no es válido"),
];

export const createValidationUsuario = [
  body("name")
    .notEmpty()
    .withMessage("El nombre es obligatorio")
    .isLength({ min: 2, max: 50 })
    .withMessage("El nombre debe tener entre 2 y 50 caracteres")
    .trim()
    .escape(),
  body("lastName")
    .notEmpty()
    .withMessage("El apellido es obligatorio")
    .isLength({ min: 2, max: 50 })
    .withMessage("El apellido debe tener entre 2 y 50 caracteres")
    .trim()
    .escape(),
  body("email").notEmpty().withMessage("El email es obligatorio").isEmail().withMessage("El email no es válido").normalizeEmail(),
  body("role").notEmpty().withMessage("El rol es obligatorio").isIn(["superadmin", "admin", "odontologo"]).withMessage("El rol no es válido"),
];
