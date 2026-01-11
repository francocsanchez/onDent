import { Request, Response } from "express";
import ObraSocial from "../models/ObraSocial";

export class ObraSocialController {
  static create = async (req: Request, res: Response): Promise<void> => {
    const { name } = req.body;
    try {
      const existingObraSocial = await ObraSocial.findOne({ name });
      if (existingObraSocial) {
        res.status(400).json({ message: "La obra social ya está registrada" });
        return;
      }

      const newObraSocial = new ObraSocial({ name });
      await newObraSocial.save();

      res.status(200).json({ message: "Obra Social creada exitosamente" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error(message);

      res.status(500).json({ message: "Error al crear obra social" });
      return;
    }
  };
  static getAll = async (req: Request, res: Response) => {
    try {
      const obrasSociales = await ObraSocial.find({}).lean();
      res.status(200).json({
        data: obrasSociales,
        message: "Listado de obras sociales",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error(message);

      return res.status(500).json({ message: "Error al listar las obras sociales" });
    }
  };
  static getByID = async (req: Request, res: Response) => {
    try {
      const obraSocial = await ObraSocial.findById(req.params.idObraSocial).lean();

      if (!obraSocial) {
        res.status(404).json({ message: "Obra Social no encontrada" });
        return;
      }

      res.status(200).json({
        data: obraSocial,
        message: "Obra Social listada",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error(message);

      return res.status(500).json({ message: "Error al listar obra social" });
    }
  };
  static changeStatus = async (req: Request, res: Response) => {
    try {
      const obraSocial = await ObraSocial.findById(req.params.idObraSocial);

      if (!obraSocial) {
        res.status(404).json({ message: "Obra social no encontrada" });
        return;
      }

      obraSocial.enable = !obraSocial.enable;
      await obraSocial.save();

      return res.status(200).json({
        message: `Obra social ${obraSocial.enable ? "habilitada" : "deshabilitada"} correctamente`,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error(message);

      return res.status(500).json({ message: "Error al listar obra social" });
    }
  };
}
