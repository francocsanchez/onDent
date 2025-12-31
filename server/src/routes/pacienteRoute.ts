import { Router } from "express";
import { PacienteController } from "../controllers/PacienteController";

const router = Router();

router.get("/", PacienteController.getAll);
router.get("/:idPaciente", PacienteController.getPaciente);

export default router;
