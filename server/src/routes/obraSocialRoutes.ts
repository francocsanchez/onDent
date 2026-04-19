import { Router } from "express";

import { ObraSocialController } from "../controllers/ObraSocialController";
import { authenticate } from "../middleware/authenticate";
import { handleImputErrors } from "../middleware/validation";
import { createValidationObraSocial, idValidationObraSocial } from "../validation/obrasSociales";

const router = Router();

router.use(authenticate);

/**
 * @method GET
 * @route /
 * @params Ninguno.
 * @description Lista todas las obras sociales.
 */
router.get("/", ObraSocialController.getAll);

/**
 * @method POST
 * @route /
 * @params Ninguno.
 * @description Crea una nueva obra social.
 */
router.post("/", createValidationObraSocial, handleImputErrors, ObraSocialController.create);

/**
 * @method GET
 * @route /:idObraSocial
 * @params idObraSocial: ID de la obra social.
 * @description Obtiene una obra social por su ID.
 */
router.get("/:idObraSocial", idValidationObraSocial, handleImputErrors, ObraSocialController.getByID);

/**
 * @method PUT
 * @route /:idObraSocial
 * @params idObraSocial: ID de la obra social.
 * @description Actualiza una obra social por su ID.
 */
router.put("/:idObraSocial", idValidationObraSocial, handleImputErrors, ObraSocialController.update);
/**
 * @method PATCH
 * @route /:idObraSocial/change-status
 * @params idObraSocial: ID de la obra social.
 * @description Cambia el estado de una obra social por su ID.
 */
router.patch("/:idObraSocial/change-status", idValidationObraSocial, handleImputErrors, ObraSocialController.changeStatus);

export default router;
