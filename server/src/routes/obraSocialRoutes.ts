import { Router } from "express";

import { ObraSocialController } from "../controllers/ObraSocialController";
import { handleImputErrors } from "../middleware/validation";
import { createValidationObraSocial, idValidationObraSocial } from "../validation/obrasSociales";

const router = Router();

/**
 * @route GET /
 * @desc Listar obras sociales.
 */
router.get("/", ObraSocialController.getAll);

/**
 * @route POST /
 * @desc Crear una nueva obra social.
 */
router.post("/", createValidationObraSocial, handleImputErrors, ObraSocialController.create);

/**
 * @route GET /:idObraSocial
 * @params idObraSocial
 * @desc Obtener una obra social por su ID.
 */
router.get("/:idObraSocial", idValidationObraSocial, handleImputErrors, ObraSocialController.getByID);

/**
 * @route PUT /:idObraSocial
 * @params idObraSocial
 * @desc Actualizar una obra social por su ID.
 */
router.put("/:idObraSocial", idValidationObraSocial, handleImputErrors, ObraSocialController.update);
/**
 * @route PATCH /:idObraSocial/change-status
 * @params idObraSocial
 * @desc Cambiar el estado de una obra social por su ID.
 */
router.patch("/:idObraSocial/change-status", idValidationObraSocial, handleImputErrors, ObraSocialController.changeStatus);

export default router;
