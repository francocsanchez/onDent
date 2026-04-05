import { Router } from "express";

import { ObraSocialController } from "../controllers/ObraSocialController";
import { handleImputErrors } from "../middleware/validation";
import { createValidation, idValidation } from "../validation/obrasSociales";

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
router.post("/", createValidation, handleImputErrors, ObraSocialController.create);

/**
 * @route GET /:idObraSocial
 * @params idObraSocial
 * @desc Obtener una obra social por su ID.
 */
router.get("/:idObraSocial", idValidation, handleImputErrors, ObraSocialController.getByID);

/**
 * @route PATCH /:idObraSocial/change-status
 * @params idObraSocial
 * @desc Cambiar el estado de una obra social por su ID.
 */
router.patch("/:idObraSocial/change-status", idValidation, handleImputErrors, ObraSocialController.changeStatus);

export default router;
