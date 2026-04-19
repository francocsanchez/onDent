import { Router } from "express";
import { PacienteController } from "../controllers/PacienteController";
import { handleImputErrors } from "../middleware/validation";
import { createValidationPaciente, idValidationPaciente, updateValidationPaciente } from "../validation/pacientes";

const router = Router();

/**
 *
 * @route GET /
 * @desc Listar todos los pacientes.
 *
 */
router.get("/", PacienteController.getAll);

/**
 *
 * @route GET /
 * @desc Listar todos los pacientes.
 *
 */
router.get("/:dni/busqueda", PacienteController.getByDNI);

/**
 *
 * @route POST /
 * @desc Crear un nuevo paciente.
 *
 */
router.post("/", createValidationPaciente, handleImputErrors, PacienteController.create);

/**
 *
 * @route GET /:idPaciente
 * @params idPaciente
 * @desc Obtener un paciente por su ID.
 *
 */
router.get("/:idPaciente", idValidationPaciente, handleImputErrors, PacienteController.getByID);

/**
 *
 * @route PUT /:idPaciente
 * @params idPaciente
 * @desc Actualizar un paciente por su ID.
 *
 */
router.put("/:idPaciente", updateValidationPaciente, handleImputErrors, PacienteController.updateByID);

export default router;
