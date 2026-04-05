import { Router } from "express";

import { handleImputErrors } from "../middleware/validation";
import { CodigoController } from "../controllers/CodigoController";
import { createValidation, idValidation, updateValidation } from "../validation/codigos";

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
router.post("/", createValidation, handleImputErrors, CodigoController.create);

/**
 *
 * @route GET /:idCodigo
 * @desc Obtener un código por ID
 *
 */
router.get("/:idCodigo", idValidation, handleImputErrors, CodigoController.getByID);

/**
 *
 * @route PUT /:idCodigo
 * @desc Actualizar un código por ID
 *
 */
router.put("/:idCodigo", updateValidation, handleImputErrors, CodigoController.updateByID);

/**
 *
 * @route PATCH /:idCodigo/change-status
 * @desc Cambiar estado de un código por ID
 *
 */
router.patch("/:idCodigo/change-status", idValidation, handleImputErrors, CodigoController.changeStatus);

export default router;
