import { body, param } from "express-validator";
import mongoose from "mongoose";

const limitePrestacionesMensualesValidation = body("limitePrestacionesMensuales")
  .optional({ values: "falsy" })
  .isInt({ min: 0 })
  .withMessage("El límite mensual de prestaciones debe ser un número entero mayor o igual a 0")
  .toInt();

export const idValidationObraSocial = param("idObraSocial")
  .notEmpty()
  .withMessage("El id de la obra social es obligatorio")
  .custom((value) => mongoose.Types.ObjectId.isValid(value))
  .withMessage("El id de la obra social no es válido");

export const createValidationObraSocial = [
  body("name")
    .notEmpty()
    .withMessage("El nombre es obligatorio")
    .isString()
    .withMessage("El nombre debe ser un texto")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("El nombre debe tener entre 2 y 50 caracteres")
    .customSanitizer((value: string) => value.toLowerCase()),
  limitePrestacionesMensualesValidation,
];

export const updateValidationObraSocial = [...createValidationObraSocial];
