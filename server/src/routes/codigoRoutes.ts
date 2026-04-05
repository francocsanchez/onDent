import { Router } from "express";

import { handleImputErrors } from "../middleware/validation";
import { CodigoController } from "../controllers/CodigoController";
import { createValidationCodigo, idValidationCodigo, updateValidationCodigo } from "../validation/codigos";

const router = Router();

/**
 *
 * @route GET /
 * @desc Listar todos los códigos
 *
 */
router.get("/", CodigoController.getAll);

/**
 *
 * @route POST /
 * @desc Crear un código
 *
 */
router.post("/", createValidationCodigo, handleImputErrors, CodigoController.create);

/**
 *
 * @route GET /:idCodigo
 * @desc Obtener un código por ID
 *
 */
router.get("/:idCodigo", idValidationCodigo, handleImputErrors, CodigoController.getByID);

/**
 *
 * @route PUT /:idCodigo
 * @desc Actualizar un código por ID
 *
 */
router.put("/:idCodigo", updateValidationCodigo, handleImputErrors, CodigoController.updateByID);

/**
 *
 * @route PATCH /:idCodigo/change-status
 * @desc Cambiar estado de un código por ID
 *
 */
router.patch("/:idCodigo/change-status", idValidationCodigo, handleImputErrors, CodigoController.changeStatus);

export default router;
