import { Request, Response } from "express";
import Usuario from "../models/Usuario";

export class UsuarioController {
  static getAll = async (req: Request, res: Response) => {
    try {
      const usuarios = await Usuario.find({});
      res.status(201).json({
        data: usuarios,
        message: "Listado de usuarios",
      });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ message: "Error al listar los usuarios" });
    }
  };
}
