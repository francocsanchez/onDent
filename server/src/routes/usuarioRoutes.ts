import { Router } from "express";
import { UsuarioController } from "../controllers/UsuarioController";
import { handleImputErrors } from "../middleware/validation";
import { createValidationUsuario, idValidationUsuario, updateValidationUsuario } from "../validation/usuarios";
import { authenticate } from "../middleware/authenticate";

const router = Router();

/**
 * @method POST
 * @route /login
 * @params Ninguno.
 * @description Inicia sesión de usuario y devuelve el token de autenticación.
 */
router.post("/login", UsuarioController.login);

router.use(authenticate);

/**
 * @method GET
 * @route /me
 * @params Ninguno.
 * @description Obtiene los datos del usuario autenticado.
 */
router.get("/me", UsuarioController.getMe);

/**
 * @method GET
 * @route /
 * @params Ninguno.
 * @description Lista todos los usuarios.
 */
router.get("/", UsuarioController.getAll);

/**
 * @method PATCH
 * @route /me/password
 * @params Ninguno.
 * @description Actualiza la contraseña del usuario autenticado.
 */
router.patch("/me/password", UsuarioController.updateMyPassword);

/**
 * @method POST
 * @route /
 * @params Ninguno.
 * @description Crea un nuevo usuario.
 */
router.post("/", createValidationUsuario, handleImputErrors, UsuarioController.create);

/**
 * @method GET
 * @route /:idUsuario
 * @params idUsuario: ID del usuario.
 * @description Obtiene un usuario por su ID.
 */
router.get("/:idUsuario", idValidationUsuario, handleImputErrors, UsuarioController.getByID);

/**
 * @method PUT
 * @route /:idUsuario
 * @params idUsuario: ID del usuario.
 * @description Actualiza un usuario por su ID.
 */
router.put("/:idUsuario", updateValidationUsuario, handleImputErrors, UsuarioController.updateByID);

/**
 * @method PATCH
 * @route /:idUsuario/change-status
 * @params idUsuario: ID del usuario.
 * @description Cambia el estado de un usuario por su ID.
 */
router.patch("/:idUsuario/change-status", idValidationUsuario, handleImputErrors, UsuarioController.changeStatus);

export default router;
