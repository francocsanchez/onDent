import { Request, Response } from "express";
import Rx from "../models/Rx";
import TipoRx from "../models/TipoRx";
import Usuario from "../models/Usuario";
import Paciente from "../models/Paciente";
import { logError } from "../utils/logError";

const RX_PAGE_SIZE = 30;

export class RxController {
  static tiposMensualReport = async (req: Request, res: Response) => {
    try {
      const rawYear = typeof req.query.year === "string" ? req.query.year.trim() : "";

      if (rawYear && !/^\d{4}$/.test(rawYear)) {
        return res.status(400).json({
          data: null,
          message: "El año debe tener formato YYYY",
        });
      }

      const requestedYear = rawYear ? Number(rawYear) : new Date().getFullYear();
      const rxYears = await Rx.aggregate([
        {
          $project: {
            year: { $toInt: { $substr: ["$fecha", 0, 4] } },
          },
        },
        {
          $group: {
            _id: "$year",
          },
        },
        { $sort: { _id: -1 } },
      ]);

      const resumen = await Rx.aggregate([
        {
          $match: {
            fecha: { $regex: `^${requestedYear}-` },
          },
        },
        {
          $lookup: {
            from: "tipos_rx",
            localField: "tipoRx",
            foreignField: "_id",
            as: "tipoRx",
          },
        },
        { $unwind: "$tipoRx" },
        {
          $group: {
            _id: {
              tipoRxId: "$tipoRx._id",
              tipoRxName: "$tipoRx.name",
              periodo: { $substr: ["$fecha", 0, 7] },
            },
            cantidad: { $sum: 1 },
          },
        },
        { $sort: { "_id.tipoRxName": 1, "_id.periodo": 1 } },
      ]);

      const countsMap = new Map<string, number>(
        resumen.map((item) => [`${String(item._id.tipoRxId)}|${String(item._id.periodo)}`, item.cantidad as number]),
      );

      const tiposFromRx = Array.from(
        new Map(
          resumen.map((item) => [
            String(item._id.tipoRxId),
            {
              _id: String(item._id.tipoRxId),
              name: String(item._id.tipoRxName),
            },
          ]),
        ).values(),
      );

      const tiposCatalogo = await TipoRx.find({}).select("_id name").sort({ name: 1 }).lean();
      const tiposUnificados = Array.from(
        new Map(
          [...tiposFromRx, ...tiposCatalogo.map((tipoRx) => ({ _id: String(tipoRx._id), name: tipoRx.name }))].map((tipoRx) => [tipoRx._id, tipoRx]),
        ).values(),
      ).sort((a, b) => a.name.localeCompare(b.name, "es"));

      const data = tiposUnificados.map((tipoRx) => ({
        tipoRx: {
          _id: tipoRx._id,
          name: tipoRx.name,
        },
        meses: Array.from({ length: 12 }, (_, index) => {
          const month = index + 1;
          const periodo = `${requestedYear}-${String(month).padStart(2, "0")}`;

          return {
            periodo,
            anio: requestedYear,
            mes: month,
            cantidad: countsMap.get(`${String(tipoRx._id)}|${periodo}`) ?? 0,
          };
        }),
      }));

      return res.status(200).json({
        data: {
          availableYears: rxYears.map((item) => item._id as number),
          selectedYear: requestedYear,
          resumenPorTipo: data,
        },
        message: "Reporte mensual de tipos de RX",
      });
    } catch (error) {
      logError("RxController.tiposMensualReport");
      console.error(error);
      return res.status(500).json({ data: null, message: "Error del servidor" });
    }
  };

  static getAll = async (req: Request, res: Response) => {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const skip = (page - 1) * RX_PAGE_SIZE;

    try {
      const [rxList, total] = await Promise.all([
        Rx.find({})
          .populate("paciente")
          .populate("tipoRx")
          .populate("usuarioCarga", "_id name lastName email role enable")
          .populate("derivanteUsuario", "_id name lastName role")
          .sort({ fecha: -1, _id: -1 })
          .skip(skip)
          .limit(RX_PAGE_SIZE)
          .lean(),
        Rx.countDocuments({}),
      ]);

      const totalPages = Math.ceil(total / RX_PAGE_SIZE);

      return res.status(200).json({
        data: rxList,
        pagination: {
          total,
          page,
          limit: RX_PAGE_SIZE,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        message: "Listado de RX",
      });
    } catch (error) {
      logError("RxController.getAll");
      console.error(error);
      return res.status(500).json({ data: null, message: "Error del servidor" });
    }
  };

  static getFilters = async (_req: Request, res: Response) => {
    try {
      const [odontologos, tiposRx] = await Promise.all([
        Usuario.find({ enable: true, role: "odontologo" }, "_id name lastName role").sort({ lastName: 1, name: 1 }).lean(),
        TipoRx.find({ enable: true }, "_id name").sort({ name: 1 }).lean(),
      ]);

      return res.status(200).json({
        data: {
          odontologos,
          tiposRx,
        },
        message: "Filtros de RX",
      });
    } catch (error) {
      logError("RxController.getFilters");
      console.error(error);
      return res.status(500).json({ data: null, message: "Error del servidor" });
    }
  };

  static create = async (req: Request, res: Response) => {
    const { fecha, paciente, derivanteTipo, derivanteUsuario, derivanteExterno, tipoRx, valor, usuarioCarga, observacion } = req.body;

    try {
      const [pacienteDoc, tipoRxDoc, usuarioCargaDoc] = await Promise.all([
        Paciente.findById(paciente).lean(),
        TipoRx.findOne({ _id: tipoRx, enable: true }).lean(),
        Usuario.findById(usuarioCarga).lean(),
      ]);

      if (!pacienteDoc) {
        return res.status(404).json({ data: null, message: "Paciente no encontrado" });
      }

      if (!tipoRxDoc) {
        return res.status(400).json({ data: null, message: "El tipo de RX no está disponible" });
      }

      if (!usuarioCargaDoc) {
        return res.status(404).json({ data: null, message: "Usuario cargador no encontrado" });
      }

      if (String(req.user?._id) !== String(usuarioCarga)) {
        return res.status(403).json({ data: null, message: "No podés registrar una RX en nombre de otro usuario" });
      }

      if (derivanteTipo === "interno") {
        if (!derivanteUsuario) {
          return res.status(400).json({ data: null, message: "Debés seleccionar un odontólogo derivante" });
        }

        const odontologo = await Usuario.findOne({ _id: derivanteUsuario, role: "odontologo", enable: true }).lean();
        if (!odontologo) {
          return res.status(400).json({ data: null, message: "El odontólogo derivante no es válido" });
        }
      }

      if (derivanteTipo === "externo" && !String(derivanteExterno ?? "").trim()) {
        return res.status(400).json({ data: null, message: "Debés ingresar el derivante externo" });
      }

      const rx = await Rx.create({
        fecha,
        paciente,
        derivanteTipo,
        derivanteUsuario: derivanteTipo === "interno" ? derivanteUsuario : undefined,
        derivanteExterno: derivanteTipo === "externo" ? String(derivanteExterno).trim() : undefined,
        tipoRx,
        valor: typeof valor === "undefined" || valor === null || valor === "" ? 0 : Number(valor),
        usuarioCarga,
        observacion: typeof observacion === "string" && observacion.trim() ? observacion.trim() : undefined,
      });

      return res.status(200).json({
        data: rx,
        message: "RX registrada exitosamente",
      });
    } catch (error) {
      logError("RxController.create");
      console.error(error);
      return res.status(500).json({ data: null, message: "Error del servidor" });
    }
  };
}
