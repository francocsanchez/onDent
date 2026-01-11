import { Router } from "express";
import { ObraSocialController } from "../controllers/ObraSocialController";
import { body } from "express-validator";
import { handleImputErrors } from "../middleware/validation";

const router = Router();

// CRUD Obra Social
router.post(
  "/",
  body("name")
    .notEmpty()
    .withMessage("El nombre es obligatorio")
    .isLength({ min: 2, max: 50 })
    .withMessage("El nombre debe tener entre 2 y 50 caracteres")
    .trim()
    .escape(),
  handleImputErrors,
  ObraSocialController.create
);
router.get("/", ObraSocialController.getAll);
router.get("/:idObraSocial", ObraSocialController.getByID);
router.patch("/:idObraSocial/status", ObraSocialController.changeStatus);

export default router;
