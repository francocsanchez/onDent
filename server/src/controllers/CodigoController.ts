import { Request, Response } from "express";
import Codigo from "../models/Codigo";
import { logError } from "../utils/logError";

export class CodigoController {
  static create = async (req: Request, res: Response) => {
    const { code, description, obraSocial } = req.body;

    try {
      const existingCodigo = await Codigo.findOne({
        code,
        obraSocial,
      }).lean();

      if (existingCodigo) {
        return res.status(400).json({
          data: null,
          message: "El código ya está registrado para esta obra social",
        });
      }

      const newCodigo = new Codigo({
        code,
        description: description.toLowerCase(),
        obraSocial,
      });

      await newCodigo.save();

      return res.status(200).json({
        data: newCodigo,
        message: "Código creado exitosamente",
      });
    } catch (error) {
      logError("CodigoController.create");
      console.error(error);
      return res.status(500).json({
        data: null,
        message: "Error del servidor",
      });
    }
  };

  static getAll = async (req: Request, res: Response) => {
    try {
      const codigos = await Codigo.find({}).populate("obraSocial").lean();

      return res.status(200).json({
        data: codigos,
        message: "Listado de códigos",
      });
    } catch (error) {
      logError("CodigoController.getAll");
      console.error(error);
      return res.status(500).json({
        data: null,
        message: "Error del servidor",
      });
    }
  };

  static getByID = async (req: Request, res: Response) => {
    const { idCodigo } = req.params;

    try {
      const codigo = await Codigo.findById(idCodigo).lean();

      if (!codigo) {
        return res.status(404).json({
          data: null,
          message: "Código no encontrado",
        });
      }

      return res.status(200).json({
        data: codigo,
        message: "Código obtenido",
      });
    } catch (error) {
      logError("CodigoController.getByID");
      console.error(error);
      return res.status(500).json({
        data: null,
        message: "Error del servidor",
      });
    }
  };

  static updateByID = async (req: Request, res: Response) => {
    const { idCodigo } = req.params;
    const { code, description, obraSocial } = req.body;

    try {
      const existingCodigo = await Codigo.findOne({
        code,
        obraSocial,
        _id: { $ne: idCodigo },
      }).lean();

      if (existingCodigo) {
        return res.status(400).json({
          data: null,
          message: "El código ya está registrado para esta obra social",
        });
      }

      const updatedCodigo = await Codigo.findByIdAndUpdate(
        idCodigo,
        {
          code,
          description: description.toLowerCase(),
          obraSocial,
        },
        { new: true }
      );

      if (!updatedCodigo) {
        return res.status(404).json({
          data: null,
          message: "Código no encontrado",
        });
      }

      return res.status(200).json({
        data: updatedCodigo,
        message: "Código actualizado",
      });
    } catch (error) {
      logError("CodigoController.updateByID");
      console.error(error);
      return res.status(500).json({
        data: null,
        message: "Error del servidor",
      });
    }
  };

  static changeStatus = async (req: Request, res: Response) => {
    const { idCodigo } = req.params;

    try {
      const codigo = await Codigo.findById(idCodigo);

      if (!codigo) {
        return res.status(404).json({
          data: null,
          message: "Código no encontrado",
        });
      }

      codigo.enable = !codigo.enable;
      await codigo.save();

      return res.status(200).json({
        data: codigo,
        message: `Código ${codigo.enable ? "habilitado" : "deshabilitado"} correctamente`,
      });
    } catch (error) {
      logError("CodigoController.changeStatus");
      console.error(error);
      return res.status(500).json({
        data: null,
        message: "Error del servidor",
      });
    }
  };
}
