import { Router } from "express";
import { PacienteController } from "../controllers/PacienteController";
import { authenticate } from "../middleware/authenticate";
import { handleImputErrors } from "../middleware/validation";
import { createValidationPaciente, idValidationPaciente, updateValidationPaciente } from "../validation/pacientes";

const router = Router();

router.use(authenticate);

/**
 * @method GET
 * @route /
 * @params Ninguno.
 * @description Lista todos los pacientes.
 */
router.get("/", PacienteController.getAll);

/**
 * @method GET
 * @route /:dni/busqueda
 * @params dni: DNI del paciente.
 * @description Busca un paciente por su DNI.
 */
router.get("/:dni/busqueda", PacienteController.getByDNI);

/**
 * @method POST
 * @route /
 * @params Ninguno.
 * @description Crea un nuevo paciente.
 */
router.post("/", createValidationPaciente, handleImputErrors, PacienteController.create);

/**
 * @method GET
 * @route /:idPaciente
 * @params idPaciente: ID del paciente.
 * @description Obtiene un paciente por su ID.
 */
router.get("/:idPaciente", idValidationPaciente, handleImputErrors, PacienteController.getByID);

/**
 * @method PUT
 * @route /:idPaciente
 * @params idPaciente: ID del paciente.
 * @description Actualiza un paciente por su ID.
 */
router.put("/:idPaciente", updateValidationPaciente, handleImputErrors, PacienteController.updateByID);

export default router;
