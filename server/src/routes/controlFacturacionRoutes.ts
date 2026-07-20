import { Router } from "express";
import { ControlFacturacionController } from "../controllers/ControlFacturacionController";
import { authenticate } from "../middleware/authenticate";
import { authorizeRoles } from "../middleware/authorizeRoles";
import { handleImputErrors } from "../middleware/validation";
import { createValidationControlFacturacion, listValidationControlFacturacion } from "../validation/controlFacturacion";

const router = Router();

router.use(authenticate);
router.use(authorizeRoles("superadmin"));

router.get("/pacientes", listValidationControlFacturacion, handleImputErrors, ControlFacturacionController.getPacientes);
router.get("/", listValidationControlFacturacion, handleImputErrors, ControlFacturacionController.getAll);
router.post("/", createValidationControlFacturacion, handleImputErrors, ControlFacturacionController.create);

export default router;
