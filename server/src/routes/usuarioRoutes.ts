import { Router } from "express";
import { UsuarioController } from "../controllers/UsuarioController";
import { handleImputErrors } from "../middleware/validation";
import { createValidationUsuario, idValidationUsuario, updateValidationUsuario } from "../validation/usuarios";

const router = Router();

/**
 *
 * @route GET /
 * @desc Listar todos los usuarios
 *
 */
router.get("/", UsuarioController.getAll);

/**
 *
 * @route POST /
 * @desc Crear un usuario
 *
 */
router.post("/", createValidationUsuario, handleImputErrors, UsuarioController.create);

/**
 *
 * @route GET /:idUsuario
 * @params idUsuario
 * @desc Obtener un usuario por su ID.
 *
 */
router.get("/:idUsuario", idValidationUsuario, handleImputErrors, UsuarioController.getByID);

/**
 *
 * @route PUT /:idUsuario
 * @desc Actualizar un usuario por ID
 *
 */
router.put("/:idUsuario", updateValidationUsuario, handleImputErrors, UsuarioController.updateByID);

/**
 *
 * @route PATCH /:idUsuario/change-status
 * @desc Cambiar estado de un usuario por ID
 *
 */
router.patch("/:idUsuario/change-status", idValidationUsuario, handleImputErrors, UsuarioController.changeStatus);

export default router;
