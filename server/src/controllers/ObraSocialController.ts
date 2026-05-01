import { Request, Response } from "express";
import ObraSocial from "../models/ObraSocial";
import { logError } from "../utils/logError";

const normalizeLimitePrestacionesMensuales = (value: unknown) => {
  if (value === null || typeof value === "undefined" || value === "") {
    return null;
  }

  const parsedValue = Number(value);
  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return null;
  }

  return parsedValue;
};

export class ObraSocialController {
  static create = async (req: Request, res: Response) => {
    const { name, limitePrestacionesMensuales } = req.body;

    try {
      const existingObraSocial = await ObraSocial.findOne({ name });

      if (existingObraSocial) {
        return res.status(400).json({ message: "La obra social ya está registrada" });
      }

      const newObraSocial = new ObraSocial({
        name,
        limitePrestacionesMensuales: normalizeLimitePrestacionesMensuales(limitePrestacionesMensuales),
      });
      await newObraSocial.save();

      return res.status(200).json({
        data: newObraSocial,
        message: "Obra Social creada exitosamente",
      });
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
      const obrasSociales = await ObraSocial.find({}).sort({ name: 1 }).lean();

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

  static update = async (req: Request, res: Response) => {
    const { idObraSocial } = req.params;
    const { name, limitePrestacionesMensuales } = req.body;

    try {
      const obraSocial = await ObraSocial.findById(idObraSocial);

      if (!obraSocial) {
        return res.status(404).json({
          data: null,
          message: "Obra Social no encontrada",
        });
      }

      // Validar si ya existe otra con el mismo nombre
      const existingObraSocial = await ObraSocial.findOne({
        name,
        _id: { $ne: idObraSocial },
      });

      if (existingObraSocial) {
        return res.status(400).json({
          message: "La obra social ya está registrada",
        });
      }

      obraSocial.name = name;
      obraSocial.limitePrestacionesMensuales = normalizeLimitePrestacionesMensuales(limitePrestacionesMensuales);
      await obraSocial.save();

      return res.status(200).json({
        data: obraSocial,
        message: "Obra Social actualizada correctamente",
      });
    } catch (error) {
      logError("ObraSocialController.update");
      console.error(error);
      return res.status(500).json({
        data: null,
        message: "Error del servidor",
      });
    }
  };
}
