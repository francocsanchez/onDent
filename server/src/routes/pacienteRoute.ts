import { Router } from "express";
import { PacienteController } from "../controllers/PacienteController";
import { handleImputErrors } from "../middleware/validation";
import { createValidation, idValidation, updateValidation } from "../validation/pacientes";

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
 * @route POST /
 * @desc Crear un nuevo paciente.
 *
 */
router.post("/", createValidation, handleImputErrors, PacienteController.create);

/**
 *
 * @route GET /:idPaciente
 * @params idPaciente
 * @desc Obtener un paciente por su ID.
 *
 */
router.get("/:idPaciente", idValidation, handleImputErrors, PacienteController.getByID);

/**
 *
 * @route PUT /:idPaciente
 * @params idPaciente
 * @desc Actualizar un paciente por su ID.
 *
 */
router.put("/:idPaciente", updateValidation, handleImputErrors, PacienteController.updateByID);

export default router;
