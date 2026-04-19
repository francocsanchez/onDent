import { Router } from "express";
import { UsuarioController } from "../controllers/UsuarioController";
import { handleImputErrors } from "../middleware/validation";
import { createValidationUsuario, idValidationUsuario, updateValidationUsuario } from "../validation/usuarios";
import { authenticate } from "../middleware/authenticate";

const router = Router();

/**
 *
 * @route POST /login
 * @desc Login usuario.
 *
 */
router.post("/login", UsuarioController.login);

router.use(authenticate);

/**
 *
 * @route GET /me
 * @desc Obtener usuario autenticado.
 *
 */
router.get("/me", UsuarioController.getMe);

/**
 *
 * @route GET /
 * @desc Listar todos los usuarios
 *
 */
router.get("/", UsuarioController.getAll);

/**
 *
 * @route GET /
 * @desc Listar todos los usuarios
 *
 */
router.patch("/me/password", UsuarioController.updateMyPassword);

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
