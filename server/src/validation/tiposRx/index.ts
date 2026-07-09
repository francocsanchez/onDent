import { body, param } from "express-validator";

export const idValidationTipoRx = [param("idTipoRx").isMongoId().withMessage("ID de tipo RX no válido")];

export const createValidationTipoRx = [
  body("name")
    .notEmpty()
    .withMessage("El nombre es obligatorio")
    .isLength({ min: 2, max: 80 })
    .withMessage("El nombre debe tener entre 2 y 80 caracteres")
    .trim()
    .escape(),
];

export const updateValidationTipoRx = [
  param("idTipoRx").isMongoId().withMessage("ID de tipo RX no válido"),
  body("name")
    .notEmpty()
    .withMessage("El nombre es obligatorio")
    .isLength({ min: 2, max: 80 })
    .withMessage("El nombre debe tener entre 2 y 80 caracteres")
    .trim()
    .escape(),
];
