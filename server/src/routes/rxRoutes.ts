import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { authorizeRoles } from "../middleware/authorizeRoles";
import { handleImputErrors } from "../middleware/validation";
import { RxController } from "../controllers/RxController";
import { createValidationRx } from "../validation/rx";

const router = Router();

router.use(authenticate);
router.use(authorizeRoles("rayos", "superadmin"));

router.get("/", RxController.getAll);
router.get("/filtros", RxController.getFilters);
router.post("/", createValidationRx, handleImputErrors, RxController.create);

export default router;
