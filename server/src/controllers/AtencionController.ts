import { Request, Response } from "express";
import Atencion from "../models/Atencion";
import { logError } from "../utils/logError";

export class AtencionController {
  static getAll = async (req: Request, res: Response) => {
    try {
      const atenciones = await Atencion.find({}).populate("paciente").populate("usuario").populate("obraSocial").populate("codigos.codigo").lean();

      return res.status(200).json({
        data: atenciones,
        message: "Listado de atenciones",
      });
    } catch (error) {
      logError("AtencionController.getAll");
      console.error(error);
      return res.status(500).json({
        data: null,
        message: "Error del servidor",
      });
    }
  };

  static create = async (req: Request, res: Response) => {
    const { fecha, paciente, usuario, obraSocial, codigos, observaciones, coseguro, coseguroOdonto } = req.body;

    try {
      const newAtencion = new Atencion({
        fecha,
        paciente,
        usuario,
        obraSocial,
        codigos,
        observaciones,
        coseguro,
        coseguroOdonto,
      });

      await newAtencion.save();

      return res.status(200).json({
        data: newAtencion,
        message: "Atención creada exitosamente",
      });
    } catch (error) {
      logError("AtencionController.create");
      console.error(error);
      return res.status(500).json({
        data: null,
        message: "Error del servidor",
      });
    }
  };

  static updateByID = async (req: Request, res: Response) => {
    const { idAtencion } = req.params;
    const { fecha, paciente, usuario, obraSocial, codigos, observaciones, coseguro, coseguroOdonto } = req.body;

    try {
      const updatedAtencion = await Atencion.findByIdAndUpdate(
        idAtencion,
        {
          fecha,
          paciente,
          usuario,
          obraSocial,
          codigos,
          observaciones,
          coseguro,
          coseguroOdonto,
        },
        { new: true },
      )
        .populate("paciente")
        .populate("usuario")
        .populate("obraSocial")
        .populate("codigos.codigo");

      if (!updatedAtencion) {
        return res.status(404).json({
          data: null,
          message: "Atención no encontrada",
        });
      }

      return res.status(200).json({
        data: updatedAtencion,
        message: "Atención actualizada correctamente",
      });
    } catch (error) {
      logError("AtencionController.updateByID");
      console.error(error);
      return res.status(500).json({
        data: null,
        message: "Error del servidor",
      });
    }
  };

  static changeCodigoStatus = async (req: Request, res: Response) => {
    const { idAtencion, codigoId } = req.params;
    const { status, observaciones } = req.body;

    try {
      const atencion = await Atencion.findById(idAtencion);

      if (!atencion) {
        return res.status(404).json({
          data: null,
          message: "Atención no encontrada",
        });
      }

      const codigoAtencion = atencion.codigos.find((item) => item.codigo.toString() === codigoId);

      if (!codigoAtencion) {
        return res.status(404).json({
          data: null,
          message: "Código de atención no encontrado",
        });
      }

      codigoAtencion.status = status;
      if (typeof observaciones === "string") {
        codigoAtencion.observaciones = observaciones;
      }

      await atencion.save();

      return res.status(200).json({
        data: atencion,
        message: "Estado del código actualizado correctamente",
      });
    } catch (error) {
      logError("AtencionController.changeCodigoStatus");
      console.error(error);
      return res.status(500).json({
        data: null,
        message: "Error del servidor",
      });
    }
  };

  static getByUsuario = async (req: Request, res: Response) => {
    const { idUsuario } = req.params;

    try {
      const atenciones = await Atencion.find({ usuario: idUsuario })
        .populate("paciente")
        .populate("usuario")
        .populate("obraSocial")
        .populate("codigos.codigo")
        .lean();

      return res.status(200).json({
        data: atenciones,
        message: "Listado de atenciones por usuario",
      });
    } catch (error) {
      logError("AtencionController.getByUsuario");
      console.error(error);
      return res.status(500).json({
        data: null,
        message: "Error del servidor",
      });
    }
  };

  static getByPaciente = async (req: Request, res: Response) => {
    const { idPaciente } = req.params;

    try {
      const atenciones = await Atencion.find({ paciente: idPaciente })
        .populate("paciente")
        .populate("usuario")
        .populate("obraSocial")
        .populate("codigos.codigo")
        .lean();

      return res.status(200).json({
        data: atenciones,
        message: "Listado de atenciones por paciente",
      });
    } catch (error) {
      logError("AtencionController.getByPaciente");
      console.error(error);
      return res.status(500).json({
        data: null,
        message: "Error del servidor",
      });
    }
  };

  static getAtencion = async (req: Request, res: Response) => {
    const { idAtencion } = req.params;

    try {
      const atencion = await Atencion.findById(idAtencion)
        .populate("paciente")
        .populate("usuario")
        .populate("obraSocial")
        .populate("codigos.codigo")
        .lean();

      return res.status(200).json({
        data: atencion,
      });
    } catch (error) {
      logError("AtencionController.getAtencion");
      console.error(error);
      return res.status(500).json({
        data: null,
        message: "Error del servidor",
      });
    }
  };
}
