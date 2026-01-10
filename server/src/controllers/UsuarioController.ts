import { Request, Response } from "express";
import Usuario from "../models/Usuario";
import { hashPassword } from "../helpers/hash";

export class UsuarioController {
  static getAll = async (req: Request, res: Response) => {
        console.log(`Llegaste`)
    try {
      const usuarios = await Usuario.find({}).lean();
      res.status(200).json({
        data: usuarios,
        message: "Listado de usuarios",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error(message);

      return res.status(500).json({ message: "Error al listar los usuarios" });
    }
  };
  static create = async (req: Request, res: Response): Promise<void> => {
    const { email, name, lastName } = req.body;
    try {
      const existingUser = await Usuario.findOne({ email });
      if (existingUser) {
        res.status(400).json({ message: "El email ya está registrado" });
        return;
      }

      const newUser = new Usuario({ email, name, lastName });
      newUser.password = await hashPassword(process.env.DEFAULT_USER_PASSWORD);
      await newUser.save();

      res.status(200).json({ message: "Usuario creado exitosamente" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error(message);

      res.status(500).json({ message: "Error al crear usuario" });
      return;
    }
  };
  static getByID = async (req: Request, res: Response) => {
    try {
      const usuario = await Usuario.findById(req.params.idUsuario).lean();

      if (!usuario) {
        res.status(404).json({ message: "Usuario no encontrado" });
        return;
      }

      res.status(200).json({
        data: usuario,
        message: "Usuario listado",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error(message);

      return res.status(500).json({ message: "Error al listar usuario" });
    }
  };
  static changeStatus = async (req: Request, res: Response) => {
    try {
      const usuario = await Usuario.findById(req.params.idUsuario);

      if (!usuario) {
        res.status(404).json({ message: "Usuario no encontrado" });
        return;
      }

      usuario.enable = !usuario.enable;
      await usuario.save();

      return res.status(200).json({
        message: `Usuario ${
          usuario.enable ? "habilitado" : "deshabilitado"
        } correctamente`,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error(message);

      return res.status(500).json({ message: "Error al listar usuario" });
    }
  };
}
