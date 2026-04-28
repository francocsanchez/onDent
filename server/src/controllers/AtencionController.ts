import { Request, Response } from "express";
import Atencion from "../models/Atencion";
import { logError } from "../utils/logError";
import { reporteAtencionesDash } from "../utils/reports/reporte-atencionesDash";
import { reporteAtencionesGlobal } from "../utils/reports/reporte-atencionesGlobal";

export class AtencionController {
  static getAll = async (req: Request, res: Response) => {
    try {
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = 50;
      const skip = (page - 1) * limit;

      const [atenciones, total] = await Promise.all([
        Atencion.find({ usuario: req.user._id })
          .populate("paciente")
          .populate("usuario")
          .populate("obraSocial")
          .populate("codigos.codigo")
          .sort({ fecha: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Atencion.countDocuments({}),
      ]);

      const totalPages = Math.ceil(total / limit);

      return res.status(200).json({
        data: atenciones,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
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

  static getByMonthAndStatus = async (req: Request, res: Response) => {
    try {
      const periodo = typeof req.query.periodo === "string" ? req.query.periodo.trim() : "";
      const status = typeof req.query.status === "string" ? req.query.status.trim() : "";
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = 50;
      const skip = (page - 1) * limit;

      if (!/^\d{4}-\d{2}$/.test(periodo)) {
        return res.status(400).json({
          data: null,
          message: "El período debe tener formato YYYY-MM",
        });
      }

      if (!["OK", "Pendiente", "Denegado", "Diferido", "No cargado"].includes(status)) {
        return res.status(400).json({
          data: null,
          message: "El estado no es válido",
        });
      }

      const filters = {
        usuario: req.user._id,
        fecha: { $regex: `^${periodo}` },
        codigos: { $elemMatch: { status } },
      };

      const [atenciones, total] = await Promise.all([
        Atencion.find(filters)
          .populate("paciente")
          .populate("usuario")
          .populate("obraSocial")
          .populate("codigos.codigo")
          .sort({ fecha: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Atencion.countDocuments(filters),
      ]);

      const totalPages = Math.ceil(total / limit);

      return res.status(200).json({
        data: atenciones,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        message: "Listado de atenciones filtradas por período y estado",
      });
    } catch (error) {
      logError("AtencionController.getByMonthAndStatus");
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

  static dashAtenciones = async (req: Request, res: Response) => {
    try {
      const atenciones = await Atencion.find({ usuario: req.user._id }).lean();
      const resumen = reporteAtencionesDash(atenciones);

      return res.status(200).json({
        data: resumen,
        message: "Resumen de atenciones",
      });
    } catch (error) {
      logError("AtencionController.dashAtenciones");
      console.error(error);
      return res.status(500).json({
        data: null,
        message: "Error del servidor",
      });
    }
  };

  static globalReport = async (req: Request, res: Response) => {
    try {
      const rawYear = typeof req.query.year === "string" ? req.query.year.trim() : "";

      if (rawYear && !/^\d{4}$/.test(rawYear)) {
        return res.status(400).json({
          data: null,
          message: "El año debe tener formato YYYY",
        });
      }

      const requestedYear = rawYear ? Number(rawYear) : undefined;

      const atenciones = await Atencion.find({})
        .select("fecha createdAt coseguroOdonto usuario codigos")
        .populate("usuario", "name lastName")
        .populate("codigos.codigo", "code description")
        .lean();

      const resumen = reporteAtencionesGlobal(atenciones, requestedYear);

      return res.status(200).json({
        data: resumen,
        message: "Resumen global de atenciones",
      });
    } catch (error) {
      logError("AtencionController.globalReport");
      console.error(error);
      return res.status(500).json({
        data: null,
        message: "Error del servidor",
      });
    }
  };
}
