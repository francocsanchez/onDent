import { Request, Response } from "express";
import Usuario from "../models/Usuario";
import { checkPassword, hashPassword } from "../helpers/hash";
import { generateTemporaryPassword } from "../helpers/password";
import { sendPasswordRecoveryEmail } from "../helpers/mailer";
import { logError } from "../utils/logError";
import { generateJWT } from "../helpers/jwt";

const USER_PUBLIC_PROJECTION = "-password";

export class UsuarioController {
  static getAll = async (req: Request, res: Response) => {
    try {
      const usuarios = await Usuario.find({}, USER_PUBLIC_PROJECTION).sort({ lastName: 1 }).lean();

      return res.status(200).json({
        data: usuarios,
        message: "Listado de usuarios",
      });
    } catch (error) {
      logError("UsuarioController.getAll");
      console.error(error);
      return res.status(500).json({
        data: null,
        message: "Error del servidor",
      });
    }
  };

  static create = async (req: Request, res: Response) => {
    const { email, name, lastName, role } = req.body;

    try {
      const existingUser = await Usuario.findOne({ email }).lean();

      if (existingUser) {
        return res.status(400).json({
          data: null,
          message: "El email ya está registrado",
        });
      }

      const newUser = new Usuario({
        email,
        name,
        lastName,
        role,
      });

      newUser.password = await hashPassword(process.env.DEFAULT_USER_PASSWORD as string);
      await newUser.save();

      const usuarioCreado = await Usuario.findById(newUser._id, USER_PUBLIC_PROJECTION).lean();

      return res.status(200).json({
        data: usuarioCreado,
        message: "Usuario creado exitosamente",
      });
    } catch (error) {
      logError("UsuarioController.create");
      console.error(error);
      return res.status(500).json({
        data: null,
        message: "Error del servidor",
      });
    }
  };

  static getByID = async (req: Request, res: Response) => {
    const { idUsuario } = req.params;

    try {
      const usuario = await Usuario.findById(idUsuario, USER_PUBLIC_PROJECTION).lean();

      if (!usuario) {
        return res.status(404).json({
          data: null,
          message: "Usuario no encontrado",
        });
      }

      return res.status(200).json({
        data: usuario,
        message: "Usuario listado",
      });
    } catch (error) {
      logError("UsuarioController.getByID");
      console.error(error);
      return res.status(500).json({
        data: null,
        message: "Error del servidor",
      });
    }
  };

  static updateByID = async (req: Request, res: Response) => {
    const { idUsuario } = req.params;
    const { email, name, lastName, role } = req.body;

    try {
      const existingUser = await Usuario.findOne({
        email,
        _id: { $ne: idUsuario },
      }).lean();

      if (existingUser) {
        return res.status(400).json({
          data: null,
          message: "El email ya está registrado",
        });
      }

      const updatedUser = await Usuario.findByIdAndUpdate(
        idUsuario,
        {
          email,
          name,
          lastName,
          role,
        },
        { new: true, projection: USER_PUBLIC_PROJECTION },
      ).lean();

      if (!updatedUser) {
        return res.status(404).json({
          data: null,
          message: "Usuario no encontrado",
        });
      }

      return res.status(200).json({
        data: updatedUser,
        message: "Usuario actualizado correctamente",
      });
    } catch (error) {
      logError("UsuarioController.updateByID");
      console.error(error);
      return res.status(500).json({
        data: null,
        message: "Error del servidor",
      });
    }
  };

  static changeStatus = async (req: Request, res: Response) => {
    const { idUsuario } = req.params;

    try {
      const usuario = await Usuario.findById(idUsuario);

      if (!usuario) {
        return res.status(404).json({
          data: null,
          message: "Usuario no encontrado",
        });
      }

      usuario.enable = !usuario.enable;
      await usuario.save();

      const usuarioActualizado = await Usuario.findById(idUsuario, USER_PUBLIC_PROJECTION).lean();

      return res.status(200).json({
        data: usuarioActualizado,
        message: `Usuario ${usuario.enable ? "habilitado" : "deshabilitado"} correctamente`,
      });
    } catch (error) {
      logError("UsuarioController.changeStatus");
      console.error(error);
      return res.status(500).json({
        data: null,
        message: "Error del servidor",
      });
    }
  };

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

      const ok = await checkPassword(password, user.password);

      if (!ok) {
        return res.status(401).json({
          data: null,
          message: "Credenciales inválidas",
        });
      }

      const token = generateJWT({ sub: String(user._id) });

      return res.status(200).json({
        token,
      });
    } catch (error) {
      logError("UsuarioController.login");
      console.error(error);
      return res.status(500).json({
        data: null,
        message: "Error interno del servidor",
      });
    }
  };

  static recoverPassword = async (req: Request, res: Response) => {
    try {
      const email = String(req.body.email ?? "").trim().toLowerCase();

      if (!email) {
        return res.status(400).json({
          data: null,
          message: "El email es obligatorio",
        });
      }

      const usuario = await Usuario.findOne({ email });

      if (!usuario) {
        return res.status(200).json({
          data: null,
          message: "Si el email existe, enviamos una nueva contraseña temporal.",
        });
      }

      const temporaryPassword = generateTemporaryPassword();
      usuario.password = await hashPassword(temporaryPassword);
      await usuario.save();

      await sendPasswordRecoveryEmail(usuario.email, {
        userName: `${usuario.name} ${usuario.lastName}`.trim(),
        temporaryPassword,
      });

      return res.status(200).json({
        data: null,
        message: "Revisá tu casilla de correo. Te enviamos una nueva contraseña temporal.",
      });
    } catch (error) {
      logError("UsuarioController.recoverPassword");
      console.error(error);
      return res.status(500).json({
        data: null,
        message: "No se pudo enviar el correo de recuperación",
      });
    }
  };

  static getMe = async (req: Request, res: Response) => {
    res.json(req.user);
  };

  static updateMyPassword = async (req: Request, res: Response) => {
    try {
      const { _id } = req.user;
      const { newPassword } = req.body;

      const usuario = await Usuario.findById(_id);

      if (!usuario) {
        return res.status(404).json({
          data: null,
          message: "Usuario no encontrado",
        });
      }

      usuario.password = await hashPassword(newPassword);
      await usuario.save();

      return res.status(200).json({
        data: null,
        message: "Contraseña actualizada correctamente",
      });
    } catch (error) {
      logError("UsuarioController.updateMyPassword");
      console.error(error);
      return res.status(500).json({
        data: null,
        message: "Error del servidor",
      });
    }
  };
}
