import { Router } from "express";
import { AtencionController } from "../controllers/AtencionController";
import { handleImputErrors } from "../middleware/validation";
import { changeStatusValidationAtencion, createValidationAtencion, updateValidationAtencion } from "../validation/atenciones";
import { idValidationUsuario } from "../validation/usuarios";
import { idValidationPaciente } from "../validation/pacientes";

const router = Router();

/**
 *
 * @route GET /
 * @desc Listar todas las atenciones
 *
 */
router.get("/", AtencionController.getAll);

/**
 *
 * @route POST /
 * @desc Crear una atención
 *
 */
router.post("/", createValidationAtencion, handleImputErrors, AtencionController.create);

/**
 *
 * @route PUT /:idAtencion
 * @desc Editar una atención por ID
 *
 */
router.put("/:idAtencion", updateValidationAtencion, handleImputErrors, AtencionController.updateByID);

/**
 *
 * @route PATCH /:idAtencion/codigos/:codigoId/change-status
 * @desc Cambiar estado de un código dentro de una atención
 *
 */
router.patch(
  "/:idAtencion/codigos/:codigoId/change-status",
  changeStatusValidationAtencion,
  handleImputErrors,
  AtencionController.changeCodigoStatus
);

/**
 *
 * @route GET /usuario/:idUsuario
 * @desc Listar atenciones por usuario
 *
 */
router.get("/usuario/:idUsuario", idValidationUsuario, handleImputErrors, AtencionController.getByUsuario);

/**
 *
 * @route GET /paciente/:idPaciente
 * @desc Listar atenciones por paciente
 *
 */
router.get("/paciente/:idPaciente", idValidationPaciente, handleImputErrors, AtencionController.getByPaciente);

export default router;
