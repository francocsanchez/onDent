import { Request, Response } from "express";
import Usuario from "../models/Usuario";
import { checkPassword, hashPassword } from "../helpers/hash";
import { generateTemporaryPassword } from "../helpers/password";
import { sendPasswordRecoveryEmail } from "../services/authEmailService";
import { generateJWT } from "../helpers/jwt";
import { logError } from "../utils/logError";

const FORGOT_PASSWORD_SUCCESS_MESSAGE =
  "Si la cuenta está habilitada y el correo existe, te enviaremos una contraseña temporal.";

export class AuthController {
  static login = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body as {
        email: string;
        password: string;
      };

      if (!email || !password) {
        return res.status(400).json({
          data: null,
          message: "Email y password son obligatorios",
        });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const user = await Usuario.findOne({ email: normalizedEmail }).lean();

      if (!user) {
        return res.status(401).json({
          data: null,
          message: "Credenciales inválidas",
        });
      }

      if (!user.enable) {
        return res.status(403).json({
          data: null,
          message: "Usuario deshabilitado",
        });
      }

      const isValidPassword = await checkPassword(password, user.password);

      if (!isValidPassword) {
        return res.status(401).json({
          data: null,
          message: "Credenciales inválidas",
        });
      }

      const token = generateJWT({ sub: String(user._id) });

      return res.status(200).json({ token });
    } catch (error) {
      logError("AuthController.login");
      console.error(error);
      return res.status(500).json({
        data: null,
        message: "Error interno del servidor",
      });
    }
  };

  static forgotPassword = async (req: Request, res: Response) => {
    try {
      const email = String(req.body.email ?? "").trim().toLowerCase();
      const usuario = await Usuario.findOne({ email });

      if (!usuario || !usuario.enable) {
        return res.status(200).json({
          data: null,
          message: FORGOT_PASSWORD_SUCCESS_MESSAGE,
        });
      }

      const temporaryPassword = generateTemporaryPassword(8);
      const currentPasswordHash = usuario.password;

      usuario.password = await hashPassword(temporaryPassword);
      await usuario.save();

      try {
        await sendPasswordRecoveryEmail(usuario.email, {
          userName: `${usuario.name} ${usuario.lastName}`.trim(),
          temporaryPassword,
        });
      } catch (emailError) {
        usuario.password = currentPasswordHash;
        await usuario.save();
        throw emailError;
      }

      return res.status(200).json({
        data: null,
        message: "Revisá tu correo. Si la cuenta está habilitada, te enviamos una contraseña temporal.",
      });
    } catch (error) {
      logError("AuthController.forgotPassword");
      console.error(error);
      return res.status(500).json({
        data: null,
        message: "No se pudo procesar la recuperación de contraseña. Intentá nuevamente.",
      });
    }
  };
}
