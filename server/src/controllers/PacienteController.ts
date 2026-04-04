import { Request, Response } from "express";
import Paciente from "../models/Paciente";
import { logError } from "../utils/logError";

export class PacienteController {
  static getAll = async (req: Request, res: Response) => {
    try {
      const pacientes = await Paciente.find({}).populate("obraSocial").lean();

      return res.status(200).json({
        data: pacientes,
        message: "Listado de pacientes",
      });
    } catch (error) {
      logError("PacienteController.getAll");
      console.error(error);
      return res.status(500).json({
        data: null,
        message: "Error del servidor",
      });
    }
  };

  static create = async (req: Request, res: Response) => {
    const { name, lastName, dni, obraSocial } = req.body;

    try {
      const existingPaciente = await Paciente.findOne({ dni });

      if (existingPaciente) {
        return res.status(400).json({
          message: "Ya existe un paciente registrado con ese DNI",
        });
      }

      const newPaciente = new Paciente({
        name,
        lastName,
        dni,
        obraSocial,
      });

      await newPaciente.save();

      return res.status(200).json({
        message: "Paciente creado exitosamente",
      });
    } catch (error) {
      logError("PacienteController.create");
      console.error(error);
      return res.status(500).json({
        data: null,
        message: "Error del servidor",
      });
    }
  };

  static getByID = async (req: Request, res: Response) => {
    const { idPaciente } = req.params;

    try {
      const paciente = await Paciente.findById(idPaciente).populate("obraSocial").lean();

      if (!paciente) {
        return res.status(404).json({
          data: null,
          message: "Paciente no encontrado",
        });
      }

      return res.status(200).json({
        data: paciente,
        message: "Paciente listado",
      });
    } catch (error) {
      logError("PacienteController.getByID");
      console.error(error);
      return res.status(500).json({
        data: null,
        message: "Error del servidor",
      });
    }
  };

  static updateByID = async (req: Request, res: Response) => {
    const { idPaciente } = req.params;
    const { name, lastName, dni, obraSocial } = req.body;

    try {
      const paciente = await Paciente.findById(idPaciente);

      if (!paciente) {
        return res.status(404).json({
          data: null,
          message: "Paciente no encontrado",
        });
      }

      if (typeof dni !== "undefined" && dni !== paciente.dni) {
        const existingPaciente = await Paciente.findOne({ dni, _id: { $ne: idPaciente } });

        if (existingPaciente) {
          return res.status(400).json({
            message: "Ya existe un paciente registrado con ese DNI",
          });
        }
      }

      paciente.name = name;
      paciente.lastName = lastName;
      paciente.dni = dni;
      paciente.obraSocial = obraSocial;

      await paciente.save();

      return res.status(200).json({
        message: "Paciente actualizado exitosamente",
      });
    } catch (error) {
      logError("PacienteController.updateByID");
      console.error(error);
      return res.status(500).json({
        data: null,
        message: "Error del servidor",
      });
    }
  };
}
