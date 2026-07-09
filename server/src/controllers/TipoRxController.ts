import { Request, Response } from "express";
import TipoRx from "../models/TipoRx";
import { logError } from "../utils/logError";

export class TipoRxController {
  static getAll = async (_req: Request, res: Response) => {
    try {
      const tiposRx = await TipoRx.find({}).sort({ name: 1 }).lean();

      return res.status(200).json({
        data: tiposRx,
        message: "Listado de tipos de RX",
      });
    } catch (error) {
      logError("TipoRxController.getAll");
      console.error(error);
      return res.status(500).json({ data: null, message: "Error del servidor" });
    }
  };

  static create = async (req: Request, res: Response) => {
    const name = String(req.body.name ?? "").trim().toLowerCase();

    try {
      const existingTipoRx = await TipoRx.findOne({ name }).lean();

      if (existingTipoRx) {
        return res.status(400).json({ data: null, message: "El tipo de RX ya está registrado" });
      }

      const tipoRx = await TipoRx.create({ name });

      return res.status(200).json({
        data: tipoRx,
        message: "Tipo de RX creado exitosamente",
      });
    } catch (error) {
      logError("TipoRxController.create");
      console.error(error);
      return res.status(500).json({ data: null, message: "Error del servidor" });
    }
  };

  static getByID = async (req: Request, res: Response) => {
    const { idTipoRx } = req.params;

    try {
      const tipoRx = await TipoRx.findById(idTipoRx).lean();

      if (!tipoRx) {
        return res.status(404).json({ data: null, message: "Tipo de RX no encontrado" });
      }

      return res.status(200).json({
        data: tipoRx,
        message: "Tipo de RX obtenido",
      });
    } catch (error) {
      logError("TipoRxController.getByID");
      console.error(error);
      return res.status(500).json({ data: null, message: "Error del servidor" });
    }
  };

  static updateByID = async (req: Request, res: Response) => {
    const { idTipoRx } = req.params;
    const name = String(req.body.name ?? "").trim().toLowerCase();

    try {
      const existingTipoRx = await TipoRx.findOne({ name, _id: { $ne: idTipoRx } }).lean();

      if (existingTipoRx) {
        return res.status(400).json({ data: null, message: "El tipo de RX ya está registrado" });
      }

      const updatedTipoRx = await TipoRx.findByIdAndUpdate(idTipoRx, { name }, { new: true }).lean();

      if (!updatedTipoRx) {
        return res.status(404).json({ data: null, message: "Tipo de RX no encontrado" });
      }

      return res.status(200).json({
        data: updatedTipoRx,
        message: "Tipo de RX actualizado correctamente",
      });
    } catch (error) {
      logError("TipoRxController.updateByID");
      console.error(error);
      return res.status(500).json({ data: null, message: "Error del servidor" });
    }
  };

  static changeStatus = async (req: Request, res: Response) => {
    const { idTipoRx } = req.params;

    try {
      const tipoRx = await TipoRx.findById(idTipoRx);

      if (!tipoRx) {
        return res.status(404).json({ data: null, message: "Tipo de RX no encontrado" });
      }

      tipoRx.enable = !tipoRx.enable;
      await tipoRx.save();

      return res.status(200).json({
        data: tipoRx,
        message: `Tipo de RX ${tipoRx.enable ? "habilitado" : "deshabilitado"} correctamente`,
      });
    } catch (error) {
      logError("TipoRxController.changeStatus");
      console.error(error);
      return res.status(500).json({ data: null, message: "Error del servidor" });
    }
  };
}
