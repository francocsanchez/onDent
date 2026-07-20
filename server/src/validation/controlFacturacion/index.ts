import { body, query } from "express-validator";
import { CONTROL_FACTURACION_CARAS, CONTROL_FACTURACION_PIEZAS } from "../../models/ControlFacturacion";

export const createValidationControlFacturacion = [
  body("periodoMes")
    .notEmpty()
    .withMessage("El mes es obligatorio")
    .isInt({ min: 1, max: 12 })
    .withMessage("El mes debe estar entre 1 y 12")
    .toInt(),
  body("periodoAnio")
    .notEmpty()
    .withMessage("El año es obligatorio")
    .isInt({ min: 2000, max: 9999 })
    .withMessage("El año debe tener formato válido")
    .toInt(),
  body("paciente").notEmpty().withMessage("El paciente es obligatorio").isMongoId().withMessage("El ID del paciente no es válido"),
  body("obraSocial").notEmpty().withMessage("La obra social es obligatoria").isMongoId().withMessage("El ID de la obra social no es válido"),
  body("usuario").notEmpty().withMessage("El usuario es obligatorio").isMongoId().withMessage("El ID del usuario no es válido"),
  body("items").isArray({ min: 1 }).withMessage("Debe enviar al menos un registro"),
  body("items.*.codigo").notEmpty().withMessage("El código es obligatorio").isMongoId().withMessage("El ID del código no es válido"),
  body("items.*.pieza")
    .optional({ values: "falsy" })
    .isIn([...CONTROL_FACTURACION_PIEZAS])
    .withMessage("La pieza no es válida"),
  body("items.*.cara")
    .optional({ values: "falsy" })
    .customSanitizer((value) => {
      if (typeof value !== "string") {
        return value;
      }

      const normalizedValue = value.trim().toLowerCase();
      if (normalizedValue === "vestivular") {
        return "Vestibular";
      }

      return value.trim();
    })
    .isIn([...CONTROL_FACTURACION_CARAS])
    .withMessage("La cara no es válida"),
];

export const listValidationControlFacturacion = [
  query("page").optional().isInt({ min: 1 }).withMessage("La página no es válida").toInt(),
  query("month").optional().matches(/^(0?[1-9]|1[0-2])$/).withMessage("El mes debe tener formato MM o M"),
  query("year").optional().matches(/^\d{4}$/).withMessage("El año debe tener formato YYYY"),
  query("patient").optional().isMongoId().withMessage("El paciente no es válido"),
];
