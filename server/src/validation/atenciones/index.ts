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
  body("codigos.*.coseguro").optional().isFloat({ min: 0 }).withMessage("El coseguro debe ser numérico y no negativo"),
  body("codigos.*.status").optional().isIn(["OK", "Pendiente", "Denegado", "Diferido", "No cargado"]).withMessage("El estado no es válido"),
  body("codigos.*.observaciones").optional().isString().withMessage("Las observaciones deben ser un texto").trim(),
  body("observaciones").optional().isString().withMessage("Las observaciones deben ser un texto").trim(),
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
  body("codigos.*.coseguro").optional().isFloat({ min: 0 }).withMessage("El coseguro debe ser numérico y no negativo"),
  body("codigos.*.status").optional().isIn(["OK", "Pendiente", "Denegado", "Diferido", "No cargado"]).withMessage("El estado no es válido"),
  body("codigos.*.observaciones").optional().isString().withMessage("Las observaciones deben ser un texto").trim(),
  body("observaciones").optional().isString().withMessage("Las observaciones deben ser un texto").trim(),
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

export const updateLiquidacionValidationAtencion = [
  param("idAtencion").isMongoId().withMessage("ID de atención no válido"),
  param("codigoId").isMongoId().withMessage("ID de código no válido"),
  body("rowIndex")
    .notEmpty()
    .withMessage("La fila es obligatoria")
    .isInt({ min: 0 })
    .withMessage("La fila no es válida"),
  body("status")
    .notEmpty()
    .withMessage("El estado es obligatorio")
    .isIn(["OK", "Pendiente", "Denegado", "Diferido", "No cargado"])
    .withMessage("El estado no es válido"),
  body("valor")
    .notEmpty()
    .withMessage("El valor es obligatorio")
    .isFloat({ min: 0 })
    .withMessage("El valor debe ser numérico y no negativo"),
];

export const updateLiquidacionesBulkValidationAtencion = [
  body("items").isArray({ min: 1 }).withMessage("Debe enviar al menos una liquidación"),
  body("items.*.idAtencion").notEmpty().withMessage("La atención es obligatoria").isMongoId().withMessage("ID de atención no válido"),
  body("items.*.codigoId").notEmpty().withMessage("El código es obligatorio").isMongoId().withMessage("ID de código no válido"),
  body("items.*.rowIndex").notEmpty().withMessage("La fila es obligatoria").isInt({ min: 0 }).withMessage("La fila no es válida"),
  body("items.*.status")
    .notEmpty()
    .withMessage("El estado es obligatorio")
    .isIn(["OK", "Pendiente", "Denegado", "Diferido", "No cargado"])
    .withMessage("El estado no es válido"),
  body("items.*.valor")
    .notEmpty()
    .withMessage("El valor es obligatorio")
    .isFloat({ min: 0 })
    .withMessage("El valor debe ser numérico y no negativo"),
];

export const updateCoseguroOdontoValidationAtencion = [
  param("idAtencion").isMongoId().withMessage("ID de atención no válido"),
  body("coseguroOdonto")
    .notEmpty()
    .withMessage("El coseguro odonto es obligatorio")
    .isFloat({ min: 0 })
    .withMessage("El coseguro odonto debe ser numérico y no negativo"),
];

export const getPagosPendientesValidationAtencion = [
  query("usuario").notEmpty().withMessage("El usuario es obligatorio").isMongoId().withMessage("El usuario no es válido"),
  query("year").optional().matches(/^\d{4}$/).withMessage("El año debe tener formato YYYY"),
  query("month").optional().matches(/^(0[1-9]|1[0-2])$/).withMessage("El mes debe tener formato MM"),
  query("estadoFuente")
    .optional()
    .isIn(["OK", "Pendiente", "OK+Pendiente", "todos-visibles"])
    .withMessage("El filtro de estado no es válido"),
];

export const createPagoOdontologoValidationAtencion = [
  body("usuario").notEmpty().withMessage("El usuario es obligatorio").isMongoId().withMessage("El usuario no es válido"),
  body("periodoPago")
    .notEmpty()
    .withMessage("El período de pago es obligatorio")
    .matches(/^\d{4}-\d{2}$/)
    .withMessage("El período de pago debe tener formato YYYY-MM"),
  body("items").isArray({ min: 1 }).withMessage("Debe enviar al menos una atención a pagar"),
  body("items.*.atencionId").notEmpty().withMessage("La atención es obligatoria").isMongoId().withMessage("La atención no es válida"),
];

export const disponibilidadPrestacionesValidationAtencion = [
  query("paciente").notEmpty().withMessage("El paciente es obligatorio").isMongoId().withMessage("El ID del paciente no es válido"),
  query("obraSocial").notEmpty().withMessage("La obra social es obligatoria").isMongoId().withMessage("El ID de la obra social no es válido"),
  query("fecha")
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage("La fecha debe tener formato YYYY-MM-DD"),
];
