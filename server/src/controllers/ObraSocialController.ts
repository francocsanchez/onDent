import { Request, Response } from "express";
import ObraSocial from "../models/ObraSocial";
import { logError } from "../utils/logError";

export class ObraSocialController {
  static create = async (req: Request, res: Response) => {
    const { name } = req.body;

    try {
      const existingObraSocial = await ObraSocial.findOne({ name });

      if (existingObraSocial) {
        return res.status(400).json({ message: "La obra social ya está registrada" });
      }

      const newObraSocial = new ObraSocial({ name });
      await newObraSocial.save();

      return res.status(200).json({ message: "Obra Social creada exitosamente" });
    } catch (error) {
      logError("ObraSocialController.create");
      console.error(error);
      return res.status(500).json({
        data: null,
        message: "Error del servidor",
      });
    }
  };

  static getAll = async (req: Request, res: Response) => {
    try {
      const obrasSociales = await ObraSocial.find({}).lean();

      return res.status(200).json({
        data: obrasSociales,
        message: "Listado de obras sociales",
      });
    } catch (error) {
      logError("ObraSocialController.getAll");
      console.error(error);
      return res.status(500).json({
        data: null,
        message: "Error del servidor",
      });
    }
  };

  static getByID = async (req: Request, res: Response) => {
    const { idObraSocial } = req.params;

    try {
      const obraSocial = await ObraSocial.findById(idObraSocial).lean();

      if (!obraSocial) {
        return res.status(404).json({
          data: null,
          message: "Obra Social no encontrada",
        });
      }

      return res.status(200).json({
        data: obraSocial,
        message: "Obra Social listada",
      });
    } catch (error) {
      logError("ObraSocialController.getByID");
      console.error(error);
      return res.status(500).json({
        data: null,
        message: "Error del servidor",
      });
    }
  };

  static changeStatus = async (req: Request, res: Response) => {
    const { idObraSocial } = req.params;

    try {
      const obraSocial = await ObraSocial.findById(idObraSocial);

      if (!obraSocial) {
        return res.status(404).json({
          data: null,
          message: "Obra Social no encontrada",
        });
      }

      obraSocial.enable = !obraSocial.enable;
      await obraSocial.save();

      return res.status(200).json({
        message: `Obra social ${obraSocial.enable ? "habilitada" : "deshabilitada"} correctamente`,
      });
    } catch (error) {
      logError("ObraSocialController.changeStatus");
      console.error(error);
      return res.status(500).json({
        data: null,
        message: "Error del servidor",
      });
    }
  };
}
