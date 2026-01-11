import { Router } from "express";
import { body, param } from "express-validator";
import { UsuarioController } from "../controllers/UsuarioController";
import { handleImputErrors } from "../middleware/validation";

const router = Router();

router.get("/", UsuarioController.getAll);

router.post(
  "/",
  body("email").notEmpty().withMessage("El email es obligatorio").isEmail().withMessage("Email inválido").trim().normalizeEmail(),
  body("name")
    .notEmpty()
    .withMessage("El nombre es obligatorio")
    .isLength({ min: 2, max: 50 })
    .withMessage("El nombre debe tener entre 2 y 50 caracteres")
    .trim()
    .escape(),
  body("lastName")
    .notEmpty()
    .withMessage("El apellido es obligatorio")
    .isLength({ min: 2, max: 50 })
    .withMessage("El apellido debe tener entre 2 y 50 caracteres")
    .trim()
    .escape(),
  body("role").optional().isIn(["superadmin", "admin", "odontologo"]).withMessage("Rol inválido"),
  handleImputErrors,
  UsuarioController.create
);

router.get("/:idUsuario", param("idUsuario").isMongoId().withMessage("ID no válido"), handleImputErrors, UsuarioController.getByID);

router.patch("/:idUsuario/status", param("idUsuario").isMongoId().withMessage("ID no válido"), handleImputErrors, UsuarioController.changeStatus);

export default router;
