import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { authorizeRoles } from "../middleware/authorizeRoles";
import { handleImputErrors } from "../middleware/validation";
import { TipoRxController } from "../controllers/TipoRxController";
import { createValidationTipoRx, idValidationTipoRx, updateValidationTipoRx } from "../validation/tiposRx";

const router = Router();

router.use(authenticate);
router.use(authorizeRoles("superadmin"));

router.get("/", TipoRxController.getAll);
router.post("/", createValidationTipoRx, handleImputErrors, TipoRxController.create);
router.get("/:idTipoRx", idValidationTipoRx, handleImputErrors, TipoRxController.getByID);
router.put("/:idTipoRx", updateValidationTipoRx, handleImputErrors, TipoRxController.updateByID);
router.patch("/:idTipoRx/change-status", idValidationTipoRx, handleImputErrors, TipoRxController.changeStatus);

export default router;
