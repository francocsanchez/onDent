import { body, param } from "express-validator";
import mongoose from "mongoose";

export const createValidation = [
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
  body("dni").notEmpty().withMessage("El DNI es obligatorio").isInt({ min: 1 }).withMessage("El DNI debe ser un número entero válido").toInt(),
  body("obraSocial")
    .notEmpty()
    .withMessage("La obra social es obligatoria")
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage("El id de la obra social no es válido"),
];

export const idValidation = [
  param("idPaciente")
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage("El id del paciente no es válido"),
];

export const updateValidation = [
  param("idPaciente")
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage("El id del paciente no es válido"),
  body("name")
    .optional()
    .notEmpty()
    .withMessage("El nombre no puede estar vacío")
    .isLength({ min: 2, max: 50 })
    .withMessage("El nombre debe tener entre 2 y 50 caracteres")
    .trim()
    .escape(),
  body("lastName")
    .optional()
    .notEmpty()
    .withMessage("El apellido no puede estar vacío")
    .isLength({ min: 2, max: 50 })
    .withMessage("El apellido debe tener entre 2 y 50 caracteres")
    .trim()
    .escape(),
  body("dni").optional().isInt({ min: 1 }).withMessage("El DNI debe ser un número entero válido").toInt(),
  body("obraSocial")
    .optional()
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage("El id de la obra social no es válido"),
];
