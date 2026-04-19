import { body, param } from "express-validator";

export const idValidationCodigo = [param("idCodigo").isMongoId().withMessage("ID de código no válido")];

export const updateValidationCodigo = [
  param("idCodigo").isMongoId().withMessage("ID de código no válido"),
  body("code")
    .notEmpty()
    .withMessage("El código es obligatorio")
    .isLength({ min: 1, max: 50 })
    .withMessage("El código debe tener entre 1 y 50 caracteres")
    .trim(),
  body("description")
    .notEmpty()
    .withMessage("La descripción es obligatoria")
    .isLength({ min: 2, max: 150 })
    .withMessage("La descripción debe tener entre 2 y 150 caracteres")
    .trim()
    .escape(),
  body("obraSocial").notEmpty().withMessage("La obra social es obligatoria").isMongoId().withMessage("El ID de la obra social no es válido"),
];

export const createValidationCodigo = [
  body("code")
    .notEmpty()
    .withMessage("El código es obligatorio")
    .isLength({ min: 1, max: 50 })
    .withMessage("El código debe tener entre 1 y 50 caracteres")
    .trim(),
  body("description")
    .notEmpty()
    .withMessage("La descripción es obligatoria")
    .isLength({ min: 2, max: 150 })
    .withMessage("La descripción debe tener entre 2 y 150 caracteres")
    .trim()
    .escape(),
  body("obraSocial").notEmpty().withMessage("La obra social es obligatoria").isMongoId().withMessage("El ID de la obra social no es válido"),
];

export const idObraSocial = [
  param("idObraSocial").notEmpty().withMessage("La obra social es obligatoria").isMongoId().withMessage("El ID de la obra social no es válido"),
];
