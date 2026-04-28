import { Router } from "express";
import { AtencionController } from "../controllers/AtencionController";
import { authenticate } from "../middleware/authenticate";
import { authorizeRoles } from "../middleware/authorizeRoles";
import { handleImputErrors } from "../middleware/validation";
import { changeStatusValidationAtencion, createValidationAtencion, updateValidationAtencion } from "../validation/atenciones";
import { idValidationUsuario } from "../validation/usuarios";
import { idValidationPaciente } from "../validation/pacientes";

const router = Router();

router.use(authenticate);

/**
 * @method GET
 * @route /
 * @params Ninguno.
 * @description Lista todas las atenciones.
 */
router.get("/", AtencionController.getAll);

/**
 * @method GET
 * @route /resumen
 * @params Ninguno.
 * @description Resumen de atenciones para Dashboard.
 */
router.get("/resumen", AtencionController.dashAtenciones);

/**
 * @method GET
 * @route /reportes/global
 * @params year: año con formato YYYY.
 * @description Resumen global anual y mensual de todas las atenciones.
 */
router.get("/reportes/global", authorizeRoles("admin", "superadmin"), AtencionController.globalReport);

/**
 * @method GET
 * @route /filtrar
 * @params periodo: período con formato YYYY-MM. status: estado del código dentro de la atención. page: número de página.
 * @description Lista atenciones filtradas por período mensual y estado.
 */
router.get("/filtrar", AtencionController.getByMonthAndStatus);

/**
 * @method GET
 * @route /:idAtencion
 * @params idAtencion: ID de la atención.
 * @description Obtiene una atención por su ID.
 */
router.get("/:idAtencion", AtencionController.getAtencion);

/**
 * @method POST
 * @route /
 * @params Ninguno.
 * @description Crea una nueva atención.
 */
router.post("/", createValidationAtencion, handleImputErrors, AtencionController.create);

/**
 * @method PUT
 * @route /:idAtencion
 * @params idAtencion: ID de la atención.
 * @description Actualiza una atención por su ID.
 */
router.put("/:idAtencion", updateValidationAtencion, handleImputErrors, AtencionController.updateByID);

/**
 * @method PATCH
 * @route /:idAtencion/codigos/:codigoId/change-status
 * @params idAtencion: ID de la atención. codigoId: ID del código dentro de la atención.
 * @description Cambia el estado de un código dentro de una atención.
 */
router.patch(
  "/:idAtencion/codigos/:codigoId/change-status",
  changeStatusValidationAtencion,
  handleImputErrors,
  AtencionController.changeCodigoStatus,
);

/**
 * @method GET
 * @route /usuario/:idUsuario
 * @params idUsuario: ID del usuario.
 * @description Lista las atenciones asociadas a un usuario.
 */
router.get("/usuario/:idUsuario", idValidationUsuario, handleImputErrors, AtencionController.getByUsuario);

/**
 * @method GET
 * @route /paciente/:idPaciente
 * @params idPaciente: ID del paciente.
 * @description Lista las atenciones asociadas a un paciente.
 */
router.get("/paciente/:idPaciente", idValidationPaciente, handleImputErrors, AtencionController.getByPaciente);

export default router;
