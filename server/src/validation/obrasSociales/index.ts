import { body, param } from "express-validator";
import mongoose from "mongoose";

export const obraSocialIdValidation = param("idObraSocial")
  .notEmpty()
  .withMessage("El id de la obra social es obligatorio")
  .custom((value) => mongoose.Types.ObjectId.isValid(value))
  .withMessage("El id de la obra social no es válido");

export const nameValidationObraSocial = body("name")
  .notEmpty()
  .withMessage("El nombre es obligatorio")
  .isString()
  .withMessage("El nombre debe ser un texto")
  .trim()
  .isLength({ min: 2, max: 50 })
  .withMessage("El nombre debe tener entre 2 y 50 caracteres")
  .customSanitizer((value: string) => value.toLowerCase());
