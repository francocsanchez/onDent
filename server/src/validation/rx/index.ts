import { body } from "express-validator";

export const createValidationRx = [
  body("fecha").notEmpty().withMessage("La fecha es obligatoria").isISO8601().withMessage("La fecha no es válida"),
  body("paciente").notEmpty().withMessage("El paciente es obligatorio").isMongoId().withMessage("El paciente no es válido"),
  body("derivanteTipo")
    .notEmpty()
    .withMessage("El tipo de derivante es obligatorio")
    .isIn(["interno", "externo"])
    .withMessage("El tipo de derivante no es válido"),
  body("derivanteUsuario")
    .optional({ values: "falsy" })
    .isMongoId()
    .withMessage("El odontólogo derivante no es válido"),
  body("derivanteExterno")
    .optional({ values: "falsy" })
    .isLength({ min: 2, max: 120 })
    .withMessage("El derivante externo debe tener entre 2 y 120 caracteres")
    .trim()
    .escape(),
  body("tipoRx").notEmpty().withMessage("El tipo de RX es obligatorio").isMongoId().withMessage("El tipo de RX no es válido"),
  body("valor").optional({ values: "falsy" }).isFloat({ min: 0 }).withMessage("El valor no es válido"),
  body("usuarioCarga").notEmpty().withMessage("El usuario que carga es obligatorio").isMongoId().withMessage("El usuario que carga no es válido"),
  body("observacion")
    .optional({ values: "falsy" })
    .isLength({ max: 500 })
    .withMessage("La observación no puede superar los 500 caracteres")
    .trim()
    .escape(),
];
