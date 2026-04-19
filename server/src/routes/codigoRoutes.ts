import { Router } from "express";

import { handleImputErrors } from "../middleware/validation";
import { CodigoController } from "../controllers/CodigoController";
import { createValidationCodigo, idObraSocial, idValidationCodigo, updateValidationCodigo } from "../validation/codigos";
import { authenticate } from "../middleware/authenticate";

const router = Router();

router.use(authenticate);
/**
 * @method GET
 * @route /
 * @params Ninguno.
 * @description Lista todos los códigos.
 */
router.get("/", CodigoController.getAll);

/**
 * @method POST
 * @route /
 * @params Ninguno.
 * @description Crea un nuevo código.
 */
router.post("/", createValidationCodigo, handleImputErrors, CodigoController.create);

/**
 * @method GET
 * @route /:idCodigo
 * @params idCodigo: ID del código.
 * @description Obtiene un código por su ID.
 */
router.get("/:idCodigo", idValidationCodigo, handleImputErrors, CodigoController.getByID);

/**
 * @method PUT
 * @route /:idCodigo
 * @params idCodigo: ID del código.
 * @description Actualiza un código por su ID.
 */
router.put("/:idCodigo", updateValidationCodigo, handleImputErrors, CodigoController.updateByID);

/**
 * @method PATCH
 * @route /:idCodigo/change-status
 * @params idCodigo: ID del código.
 * @description Cambia el estado de un código por su ID.
 */
router.patch("/:idCodigo/change-status", idValidationCodigo, handleImputErrors, CodigoController.changeStatus);

/**
 * @method GET
 * @route /:idObraSocial/obra-social
 * @params idObraSocial: ID de la obra social.
 * @description Lista los códigos asociados a una obra social.
 */
router.get("/:idObraSocial/obra-social", idObraSocial, CodigoController.getByObraSocial);

export default router;
