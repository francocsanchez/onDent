import { Request, Response } from "express";
import Paciente from "../models/Paciente";

export class PacienteController {
  static getAll = async (req: Request, res: Response) => {
    try {
      const pacientes = await Paciente.find({}).lean();
      res.status(200).json({
        data: pacientes,
        message: "Listado de pacientes",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error(message);

      return res.status(500).json({ message: "Error al listar los pacientes" });
    }
  };

  static getPaciente = async (req: Request, res: Response) => {
    try {
      const paciente = await Paciente.findById(req.params.idPaciente).lean();

      if (!paciente) {
        res.status(404).json({ message: "Paciente no encontrado" });
        return;
      }

      res.status(200).json({
        data: paciente,
        message: "Paciente listado",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error(message);

      return res.status(500).json({ message: "Error al listar paciente" });
    }
  };
}
