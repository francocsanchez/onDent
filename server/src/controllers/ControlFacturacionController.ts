import { Request, Response } from "express";
import Codigo from "../models/Codigo";
import ControlFacturacion from "../models/ControlFacturacion";
import Paciente from "../models/Paciente";
import { logError } from "../utils/logError";

export class ControlFacturacionController {
  static getPacientes = async (req: Request, res: Response) => {
    try {
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = 20;
      const skip = (page - 1) * limit;
      const month = typeof req.query.month === "string" ? Number(req.query.month) : undefined;
      const year = typeof req.query.year === "string" ? Number(req.query.year) : undefined;

      const matchStage: Record<string, number> = {};

      if (Number.isInteger(month) && month >= 1 && month <= 12) {
        matchStage.periodoMes = month;
      }

      if (Number.isInteger(year) && year >= 2000 && year <= 9999) {
        matchStage.periodoAnio = year;
      }

      const [rows, totalResult] = await Promise.all([
        ControlFacturacion.aggregate([
          { $match: matchStage },
          {
            $sort: {
              periodoAnio: -1,
              periodoMes: -1,
              createdAt: -1,
            },
          },
          {
            $group: {
              _id: "$paciente",
              paciente: { $first: "$paciente" },
              obraSocial: { $first: "$obraSocial" },
              totalRegistros: { $sum: 1 },
              totalItems: { $sum: { $size: "$items" } },
              ultimoPeriodoMes: { $first: "$periodoMes" },
              ultimoPeriodoAnio: { $first: "$periodoAnio" },
            },
          },
          {
            $lookup: {
              from: "pacientes",
              localField: "paciente",
              foreignField: "_id",
              as: "paciente",
            },
          },
          { $unwind: "$paciente" },
          {
            $lookup: {
              from: "obras_sociales",
              localField: "obraSocial",
              foreignField: "_id",
              as: "obraSocial",
            },
          },
          { $unwind: "$obraSocial" },
          {
            $sort: {
              "paciente.lastName": 1,
              "paciente.name": 1,
            },
          },
          { $skip: skip },
          { $limit: limit },
        ]),
        ControlFacturacion.aggregate([
          { $match: matchStage },
          {
            $group: {
              _id: "$paciente",
            },
          },
          { $count: "total" },
        ]),
      ]);

      const total = totalResult[0]?.total ?? 0;
      const totalPages = Math.ceil(total / limit) || 1;

      return res.status(200).json({
        data: rows,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        message: "Listado de pacientes con control de facturación",
      });
    } catch (error) {
      logError("ControlFacturacionController.getPacientes");
      console.error(error);
      return res.status(500).json({
        data: null,
        message: "Error del servidor",
      });
    }
  };

  static create = async (req: Request, res: Response) => {
    const { periodoMes, periodoAnio, paciente, obraSocial, usuario, items } = req.body;

    try {
      if (!req.user?._id) {
        return res.status(401).json({
          data: null,
          message: "Usuario no autenticado",
        });
      }

      if (String(usuario) !== String(req.user._id)) {
        return res.status(403).json({
          data: null,
          message: "No tenés permisos para crear registros en nombre de otro usuario",
        });
      }

      const pacienteDocumento = await Paciente.findById(paciente).lean();

      if (!pacienteDocumento) {
        return res.status(404).json({
          data: null,
          message: "Paciente no encontrado",
        });
      }

      if (String(pacienteDocumento.obraSocial) !== String(obraSocial)) {
        return res.status(400).json({
          data: null,
          message: "La obra social del paciente no coincide con la informada",
        });
      }

      const codigoIds = Array.from(new Set((items ?? []).map((item: { codigo: string }) => String(item.codigo))));
      const codigos = await Codigo.find({
        _id: { $in: codigoIds },
        obraSocial,
        enable: true,
      }).lean();

      if (codigos.length !== codigoIds.length) {
        return res.status(400).json({
          data: null,
          message: "Uno o más códigos no pertenecen a la obra social del paciente o están deshabilitados",
        });
      }

      const nuevoRegistro = new ControlFacturacion({
        periodoMes,
        periodoAnio,
        paciente,
        obraSocial,
        usuario: req.user._id,
        items: items.map((item: { codigo: string; pieza: string; cara: string }) => ({
          codigo: item.codigo,
          pieza: item.pieza?.trim() ? item.pieza : undefined,
          cara: item.cara?.trim() ? (item.cara === "vestivular" ? "Vestibular" : item.cara) : undefined,
        })),
      });

      await nuevoRegistro.save();
      await nuevoRegistro.populate({ path: "paciente", populate: { path: "obraSocial", select: "name" } });
      await nuevoRegistro.populate("obraSocial");
      await nuevoRegistro.populate("usuario");
      await nuevoRegistro.populate("items.codigo");

      return res.status(201).json({
        data: nuevoRegistro,
        message: "Control de facturación creado exitosamente",
      });
    } catch (error) {
      logError("ControlFacturacionController.create");
      console.error(error);
      return res.status(500).json({
        data: null,
        message: "Error del servidor",
      });
    }
  };

  static getAll = async (req: Request, res: Response) => {
    try {
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = 20;
      const skip = (page - 1) * limit;
      const month = typeof req.query.month === "string" ? Number(req.query.month) : undefined;
      const year = typeof req.query.year === "string" ? Number(req.query.year) : undefined;
      const patient = typeof req.query.patient === "string" ? req.query.patient.trim() : "";

      const filters: Record<string, number | string> = {};

      if (Number.isInteger(month) && month >= 1 && month <= 12) {
        filters.periodoMes = month;
      }

      if (Number.isInteger(year) && year >= 2000 && year <= 9999) {
        filters.periodoAnio = year;
      }

      if (patient) {
        filters.paciente = patient;
      }

      const [registros, total] = await Promise.all([
        ControlFacturacion.find(filters)
          .populate({ path: "paciente", populate: { path: "obraSocial", select: "name" } })
          .populate("obraSocial")
          .populate("usuario")
          .populate("items.codigo")
          .sort({ periodoAnio: -1, periodoMes: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        ControlFacturacion.countDocuments(filters),
      ]);

      const totalPages = Math.ceil(total / limit) || 1;

      return res.status(200).json({
        data: registros,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        message: "Listado de control de facturación",
      });
    } catch (error) {
      logError("ControlFacturacionController.getAll");
      console.error(error);
      return res.status(500).json({
        data: null,
        message: "Error del servidor",
      });
    }
  };
}
