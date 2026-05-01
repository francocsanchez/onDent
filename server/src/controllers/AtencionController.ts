import { Request, Response } from "express";
import Atencion from "../models/Atencion";
import { logError } from "../utils/logError";
import { reporteAtencionesDash } from "../utils/reports/reporte-atencionesDash";
import { reporteAtencionesGlobal } from "../utils/reports/reporte-atencionesGlobal";
import { getDisponibilidadPrestaciones, validatePrestacionesDisponibles } from "../utils/prestacionesMensuales";

const normalizeText = (value?: string | null) => (value ?? "").trim();
const validCodigoStatuses = ["OK", "Pendiente", "Denegado", "Diferido", "No cargado"] as const;
type CodigoStatus = (typeof validCodigoStatuses)[number];

const isAdminRole = (role?: string) => role === "admin" || role === "superadmin";
const buildUsuarioScopeFilter = (role?: string, userId?: string) => (isAdminRole(role) || !userId ? {} : { usuario: userId });
const buildStatusFilter = (rawStatus?: string) => {
  const status = typeof rawStatus === "string" ? rawStatus.trim() : "";

  if (!status) {
    return { filters: {} };
  }

  if (!validCodigoStatuses.includes(status as CodigoStatus)) {
    return { error: "El estado no es válido" };
  }

  return {
    filters: {
      codigos: { $elemMatch: { status } },
    },
  };
};

const getPrestacionesErrorStatus = (message?: string) => {
  if (!message) {
    return 500;
  }

  if (message === "La fecha de atención no es válida") {
    return 400;
  }

  if (message === "Obra Social no encontrada" || message === "No se pudo determinar la obra social del paciente") {
    return 404;
  }

  return 500;
};

const buildDateFilters = (rawYear?: string, rawMonth?: string) => {
  const year = typeof rawYear === "string" ? rawYear.trim() : "";
  const month = typeof rawMonth === "string" ? rawMonth.trim() : "";

  if (year && !/^\d{4}$/.test(year)) {
    return { error: "El año debe tener formato YYYY" };
  }

  if (month && !/^(0[1-9]|1[0-2])$/.test(month)) {
    return { error: "El mes debe tener formato MM" };
  }

  if (month && !year) {
    return { error: "Para filtrar por mes debés indicar también el año" };
  }

  if (!year) {
    return { filters: {} };
  }

  return {
    filters: {
      fecha: {
        $regex: month ? `^${year}-${month}` : `^${year}`,
      },
    },
  };
};

export class AtencionController {
  static getDisponibilidadPrestaciones = async (req: Request, res: Response) => {
    try {
      const paciente = typeof req.query.paciente === "string" ? req.query.paciente.trim() : "";
      const obraSocial = typeof req.query.obraSocial === "string" ? req.query.obraSocial.trim() : "";
      const fecha = typeof req.query.fecha === "string" ? req.query.fecha.trim() : undefined;

      const disponibilidad = await getDisponibilidadPrestaciones({
        pacienteId: paciente,
        obraSocialId: obraSocial,
        fecha,
      });

      return res.status(200).json({
        data: {
          tieneLimiteConfigurado: disponibilidad.tieneLimiteConfigurado,
          limiteMensual: disponibilidad.limiteMensual,
          utilizadas: disponibilidad.utilizadas,
          disponibles: disponibilidad.disponibles,
          mes: disponibilidad.mes,
          anio: disponibilidad.anio,
        },
        message: disponibilidad.tieneLimiteConfigurado
          ? "Disponibilidad de prestaciones obtenida correctamente"
          : "La obra social no posee límite mensual configurado",
      });
    } catch (error) {
      logError("AtencionController.getDisponibilidadPrestaciones");
      console.error(error);
      const message = error instanceof Error ? error.message : "Error del servidor";
      const statusCode = getPrestacionesErrorStatus(message);
      return res.status(statusCode).json({
        data: null,
        message: statusCode === 500 ? "Error del servidor" : message,
      });
    }
  };

  static getAll = async (req: Request, res: Response) => {
    try {
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = 50;
      const skip = (page - 1) * limit;
      const dateFilters = buildDateFilters(
        typeof req.query.year === "string" ? req.query.year : undefined,
        typeof req.query.month === "string" ? req.query.month : undefined,
      );
      const statusFilters = buildStatusFilter(typeof req.query.status === "string" ? req.query.status : undefined);

      if ("error" in dateFilters) {
        return res.status(400).json({
          data: null,
          message: dateFilters.error,
        });
      }

      if ("error" in statusFilters) {
        return res.status(400).json({
          data: null,
          message: statusFilters.error,
        });
      }

      const filters = {
        ...buildUsuarioScopeFilter(req.user?.role, req.user?._id),
        ...dateFilters.filters,
        ...statusFilters.filters,
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

  static getAvailableYears = async (req: Request, res: Response) => {
    try {
      const years = await Atencion.aggregate<{ _id: string }>([
        { $match: buildUsuarioScopeFilter(req.user?.role, req.user?._id) },
        {
          $project: {
            year: {
              $substr: ["$fecha", 0, 4],
            },
          },
        },
        {
          $match: {
            year: {
              $regex: /^\d{4}$/,
            },
          },
        },
        { $group: { _id: "$year" } },
        { $sort: { _id: -1 } },
      ]);

      return res.status(200).json({
        data: {
          availableYears: years.map((item) => Number(item._id)).filter((year) => Number.isInteger(year)),
        },
        message: "Años disponibles para filtrar atenciones",
      });
    } catch (error) {
      logError("AtencionController.getAvailableYears");
      console.error(error);
      return res.status(500).json({
        data: null,
        message: "Error del servidor",
      });
    }
  };

  static getExportData = async (req: Request, res: Response) => {
    try {
      const dateFilters = buildDateFilters(
        typeof req.query.year === "string" ? req.query.year : undefined,
        typeof req.query.month === "string" ? req.query.month : undefined,
      );
      const statusFilters = buildStatusFilter(typeof req.query.status === "string" ? req.query.status : undefined);

      if ("error" in dateFilters) {
        return res.status(400).json({
          data: null,
          message: dateFilters.error,
        });
      }

      if ("error" in statusFilters) {
        return res.status(400).json({
          data: null,
          message: statusFilters.error,
        });
      }

      const atenciones = await Atencion.find({
        ...buildUsuarioScopeFilter(req.user?.role, req.user?._id),
        ...dateFilters.filters,
        ...statusFilters.filters,
      })
        .populate("paciente")
        .populate("usuario")
        .populate("obraSocial")
        .populate("codigos.codigo")
        .sort({ fecha: -1 })
        .lean();

      return res.status(200).json({
        data: atenciones,
        message: "Listado de atenciones para exportar",
      });
    } catch (error) {
      logError("AtencionController.getExportData");
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

      if (!validCodigoStatuses.includes(status as CodigoStatus)) {
        return res.status(400).json({
          data: null,
          message: "El estado no es válido",
        });
      }

      const filters = {
        ...buildUsuarioScopeFilter(req.user?.role, req.user?._id),
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
      const validationResult = await validatePrestacionesDisponibles({
        pacienteId: paciente,
        obraSocialId: obraSocial,
        fecha,
        cantidadNuevosCodigos: Array.isArray(codigos) ? codigos.length : 0,
      });

      if (validationResult.excedeLimite) {
        return res.status(400).json({
          data: null,
          message: validationResult.message,
        });
      }

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
      const message = error instanceof Error ? error.message : "Error del servidor";
      return res.status(getPrestacionesErrorStatus(message)).json({
        data: null,
        message: getPrestacionesErrorStatus(message) === 500 ? "Error del servidor" : message,
      });
    }
  };

  static updateByID = async (req: Request, res: Response) => {
    const { idAtencion } = req.params;
    const { fecha, paciente, usuario, obraSocial, codigos, observaciones, coseguro, coseguroOdonto } = req.body;

    try {
      const atencion = await Atencion.findById(idAtencion);

      if (!atencion) {
        return res.status(404).json({
          data: null,
          message: "Atención no encontrada",
        });
      }

      if (req.user?.role === "odontologo") {
        if (codigos.length !== atencion.codigos.length) {
          return res.status(403).json({
            data: null,
            message: "Solo podés editar códigos en estado Pendiente",
          });
        }

        const intentoEditarCodigoAuditado = atencion.codigos.some((codigoActual, index) => {
          if (codigoActual.status === "Pendiente") {
            return false;
          }

          const codigoEntrante = codigos[index];
          if (!codigoEntrante) {
            return true;
          }

          return (
            String(codigoActual.codigo) !== String(codigoEntrante.codigo) ||
            normalizeText(codigoActual.pieza) !== normalizeText(codigoEntrante.pieza) ||
            normalizeText(codigoActual.observaciones) !== normalizeText(codigoEntrante.observaciones) ||
            Number(codigoActual.valor ?? 0) !== Number(codigoEntrante.valor ?? 0) ||
            codigoActual.status !== codigoEntrante.status
          );
        });

        if (intentoEditarCodigoAuditado) {
          return res.status(403).json({
            data: null,
            message: "Solo podés editar códigos en estado Pendiente",
          });
        }
      }

      atencion.fecha = fecha;
      atencion.paciente = paciente;
      atencion.usuario = usuario;
      atencion.obraSocial = obraSocial;
      atencion.codigos = codigos;
      atencion.observaciones = observaciones;
      atencion.coseguro = coseguro;
      atencion.coseguroOdonto = coseguroOdonto;

      await atencion.save();

      await atencion.populate("paciente");
      await atencion.populate("usuario");
      await atencion.populate("obraSocial");
      await atencion.populate("codigos.codigo");

      return res.status(200).json({
        data: atencion,
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
        .select("fecha coseguroOdonto usuario codigos")
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
