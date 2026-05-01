import { body, param, query } from "express-validator";

export const createValidationAtencion = [
  body("fecha").notEmpty().withMessage("La fecha es obligatoria").isString().withMessage("La fecha debe ser un texto").trim(),
  body("paciente").notEmpty().withMessage("El paciente es obligatorio").isMongoId().withMessage("El ID del paciente no es válido"),
  body("usuario").notEmpty().withMessage("El usuario es obligatorio").isMongoId().withMessage("El ID del usuario no es válido"),
  body("obraSocial").notEmpty().withMessage("La obra social es obligatoria").isMongoId().withMessage("El ID de la obra social no es válido"),
  body("codigos").isArray({ min: 1 }).withMessage("Debe enviar al menos un código"),
  body("codigos.*.codigo").notEmpty().withMessage("El código es obligatorio").isMongoId().withMessage("El ID del código no es válido"),
  body("codigos.*.pieza").optional().isString().withMessage("La pieza debe ser un texto").trim(),
  body("codigos.*.valor").optional().isNumeric().withMessage("El valor debe ser numérico"),
  body("codigos.*.status").optional().isIn(["OK", "Pendiente", "Denegado", "Diferido", "No cargado"]).withMessage("El estado no es válido"),
  body("codigos.*.observaciones").optional().isString().withMessage("Las observaciones deben ser un texto").trim(),
  body("observaciones").optional().isString().withMessage("Las observaciones deben ser un texto").trim(),
  body("coseguro").optional().isNumeric().withMessage("El coseguro debe ser numérico"),
  body("coseguroOdonto").optional().isNumeric().withMessage("El coseguro odonto debe ser numérico"),
];

export const updateValidationAtencion = [
  param("idAtencion").isMongoId().withMessage("ID de atención no válido"),
  body("fecha").notEmpty().withMessage("La fecha es obligatoria").isString().withMessage("La fecha debe ser un texto").trim(),
  body("paciente").notEmpty().withMessage("El paciente es obligatorio").isMongoId().withMessage("El ID del paciente no es válido"),
  body("usuario").notEmpty().withMessage("El usuario es obligatorio").isMongoId().withMessage("El ID del usuario no es válido"),
  body("obraSocial").notEmpty().withMessage("La obra social es obligatoria").isMongoId().withMessage("El ID de la obra social no es válido"),
  body("codigos").isArray({ min: 1 }).withMessage("Debe enviar al menos un código"),
  body("codigos.*.codigo").notEmpty().withMessage("El código es obligatorio").isMongoId().withMessage("El ID del código no es válido"),
  body("codigos.*.pieza").optional().isString().withMessage("La pieza debe ser un texto").trim(),
  body("codigos.*.valor").optional().isNumeric().withMessage("El valor debe ser numérico"),
  body("codigos.*.status").optional().isIn(["OK", "Pendiente", "Denegado", "Diferido", "No cargado"]).withMessage("El estado no es válido"),
  body("codigos.*.observaciones").optional().isString().withMessage("Las observaciones deben ser un texto").trim(),
  body("observaciones").optional().isString().withMessage("Las observaciones deben ser un texto").trim(),
  body("coseguro").optional().isNumeric().withMessage("El coseguro debe ser numérico"),
  body("coseguroOdonto").optional().isNumeric().withMessage("El coseguro odonto debe ser numérico"),
];

export const changeStatusValidationAtencion = [
  param("idAtencion").isMongoId().withMessage("ID de atención no válido"),
  param("codigoId").isMongoId().withMessage("ID de código no válido"),
  body("status")
    .notEmpty()
    .withMessage("El estado es obligatorio")
    .isIn(["OK", "Pendiente", "Denegado", "Diferido", "No cargado"])
    .withMessage("El estado no es válido"),
  body("observaciones").optional().isString().withMessage("Las observaciones deben ser un texto").trim(),
];

export const disponibilidadPrestacionesValidationAtencion = [
  query("paciente").notEmpty().withMessage("El paciente es obligatorio").isMongoId().withMessage("El ID del paciente no es válido"),
  query("obraSocial").notEmpty().withMessage("La obra social es obligatoria").isMongoId().withMessage("El ID de la obra social no es válido"),
  query("fecha")
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage("La fecha debe tener formato YYYY-MM-DD"),
];
