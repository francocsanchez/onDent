import { Request, Response } from "express";
import { Types, type PipelineStage } from "mongoose";
import Atencion from "../models/Atencion";
import Usuario from "../models/Usuario";
import ObraSocial from "../models/ObraSocial";
import { logError } from "../utils/logError";
import { reporteAtencionesDash } from "../utils/reports/reporte-atencionesDash";
import { reporteAtencionesGlobal } from "../utils/reports/reporte-atencionesGlobal";
import { getDisponibilidadPrestaciones, validatePrestacionesDisponibles } from "../utils/prestacionesMensuales";

const normalizeText = (value?: string | null) => (value ?? "").trim();
const validCodigoStatuses = ["OK", "Pendiente", "Denegado", "Diferido", "No cargado"] as const;
type CodigoStatus = (typeof validCodigoStatuses)[number];
const mongoIdRegex = /^[a-f\d]{24}$/i;
const LIQUIDACIONES_PAGE_SIZE = 50;
const toObjectId = (value: string) => new Types.ObjectId(value);
const getCodigoObjectIdString = (codigo: unknown) => {
  if (!codigo) return "";

  if (typeof codigo === "string") {
    return codigo;
  }

  if (codigo instanceof Types.ObjectId) {
    return codigo.toString();
  }

  if (typeof codigo === "object" && codigo !== null && "_id" in codigo) {
    const populatedId = (codigo as { _id?: unknown })._id;
    if (typeof populatedId === "string") {
      return populatedId;
    }

    if (populatedId instanceof Types.ObjectId) {
      return populatedId.toString();
    }
  }

  return "";
};

const isAdminRole = (role?: string) => role === "admin" || role === "superadmin";
const buildUsuarioScopeFilter = (role?: string, userId?: string) => (isAdminRole(role) || !userId ? {} : { usuario: toObjectId(userId) });
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

const buildObraSocialFilter = (rawObraSocial?: string) => {
  const obraSocial = typeof rawObraSocial === "string" ? rawObraSocial.trim() : "";

  if (!obraSocial) {
    return { filters: {} };
  }

  if (!mongoIdRegex.test(obraSocial)) {
    return { error: "La obra social no es válida" };
  }

  return {
    filters: {
      obraSocial: toObjectId(obraSocial),
    },
  };
};

const buildUsuarioMongoFilter = (rawUsuario?: string) => {
  const usuario = typeof rawUsuario === "string" ? rawUsuario.trim() : "";

  if (!usuario) {
    return { filters: {} };
  }

  if (!mongoIdRegex.test(usuario)) {
    return { error: "El usuario no es válido" };
  }

  return {
    filters: {
      usuario: toObjectId(usuario),
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
  static getLiquidacionesFilters = async (_req: Request, res: Response) => {
    try {
      const [years, usuarios, obrasSociales] = await Promise.all([
        Atencion.aggregate<{ _id: string }>([
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
        ]),
        Usuario.find({ enable: true }, "_id name lastName role").sort({ lastName: 1, name: 1 }).lean(),
        ObraSocial.find({ enable: true }, "_id name").sort({ name: 1 }).lean(),
      ]);

      return res.status(200).json({
        data: {
          availableYears: years.map((item) => Number(item._id)).filter((year) => Number.isInteger(year)),
          usuarios,
          obrasSociales,
        },
        message: "Filtros disponibles para liquidaciones",
      });
    } catch (error) {
      logError("AtencionController.getLiquidacionesFilters");
      console.error(error);
      return res.status(500).json({
        data: null,
        message: "Error del servidor",
      });
    }
  };

  static getLiquidaciones = async (req: Request, res: Response) => {
    try {
      const page = Math.max(Number(req.query.page) || 1, 1);
      const skip = (page - 1) * LIQUIDACIONES_PAGE_SIZE;
      const dateFilters = buildDateFilters(
        typeof req.query.year === "string" ? req.query.year : undefined,
        typeof req.query.month === "string" ? req.query.month : undefined,
      );
      const statusFilters = buildStatusFilter(typeof req.query.status === "string" ? req.query.status : undefined);
      const obraSocialFilters = buildObraSocialFilter(typeof req.query.obraSocial === "string" ? req.query.obraSocial : undefined);
      const usuarioFilters = buildUsuarioMongoFilter(typeof req.query.usuario === "string" ? req.query.usuario : undefined);

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

      if ("error" in obraSocialFilters) {
        return res.status(400).json({
          data: null,
          message: obraSocialFilters.error,
        });
      }

      if ("error" in usuarioFilters) {
        return res.status(400).json({
          data: null,
          message: usuarioFilters.error,
        });
      }

      const matchFilters = {
        ...dateFilters.filters,
        ...obraSocialFilters.filters,
        ...usuarioFilters.filters,
      };

      const statusMatchStage =
        "filters" in statusFilters && "codigos" in statusFilters.filters
          ? { "codigos.status": (statusFilters.filters.codigos as { $elemMatch: { status: CodigoStatus } }).$elemMatch.status }
          : {};

      const pipeline: PipelineStage[] = [
        { $match: matchFilters },
        { $unwind: "$codigos" },
        ...(Object.keys(statusMatchStage).length > 0 ? [{ $match: statusMatchStage }] : []),
        {
          $sort: {
            fecha: -1,
            _id: -1,
          },
        },
        {
          $facet: {
            data: [
              { $skip: skip },
              { $limit: LIQUIDACIONES_PAGE_SIZE },
              {
                $lookup: {
                  from: "pacientes",
                  localField: "paciente",
                  foreignField: "_id",
                  as: "paciente",
                },
              },
              {
                $lookup: {
                  from: "usuarios",
                  localField: "usuario",
                  foreignField: "_id",
                  as: "usuario",
                },
              },
              {
                $lookup: {
                  from: "obras_sociales",
                  localField: "obraSocial",
                  foreignField: "_id",
                  as: "obraSocial",
                },
              },
              {
                $lookup: {
                  from: "codigos",
                  localField: "codigos.codigo",
                  foreignField: "_id",
                  as: "codigoAtencion",
                },
              },
              {
                $project: {
                  _id: 0,
                  atencionId: "$_id",
                  codigoId: "$codigos.codigo",
                  fecha: 1,
                  usuario: {
                    $let: {
                      vars: { item: { $arrayElemAt: ["$usuario", 0] } },
                      in: {
                        _id: "$$item._id",
                        name: "$$item.name",
                        lastName: "$$item.lastName",
                      },
                    },
                  },
                  paciente: {
                    $let: {
                      vars: { item: { $arrayElemAt: ["$paciente", 0] } },
                      in: {
                        dni: "$$item.dni",
                        name: "$$item.name",
                        lastName: "$$item.lastName",
                      },
                    },
                  },
                  obraSocial: {
                    $let: {
                      vars: { item: { $arrayElemAt: ["$obraSocial", 0] } },
                      in: {
                        _id: "$$item._id",
                        name: "$$item.name",
                      },
                    },
                  },
                  codigoAtencion: {
                    $let: {
                      vars: { item: { $arrayElemAt: ["$codigoAtencion", 0] } },
                      in: {
                        _id: "$$item._id",
                        code: "$$item.code",
                        description: "$$item.description",
                      },
                    },
                  },
                  status: "$codigos.status",
                  valor: { $ifNull: ["$codigos.valor", 0] },
                },
              },
            ],
            totalCount: [{ $count: "total" }],
          },
        },
      ];

      const [result] = await Atencion.aggregate<{
        data: unknown[];
        totalCount: { total: number }[];
      }>(pipeline);

      const total = result?.totalCount?.[0]?.total ?? 0;
      const totalPages = Math.ceil(total / LIQUIDACIONES_PAGE_SIZE);

      return res.status(200).json({
        data: result?.data ?? [],
        pagination: {
          total,
          page,
          limit: LIQUIDACIONES_PAGE_SIZE,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        message: "Listado de liquidaciones",
      });
    } catch (error) {
      logError("AtencionController.getLiquidaciones");
      console.error(error);
      return res.status(500).json({
        data: null,
        message: "Error del servidor",
      });
    }
  };

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
      const obraSocialFilters = buildObraSocialFilter(typeof req.query.obraSocial === "string" ? req.query.obraSocial : undefined);

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

      if ("error" in obraSocialFilters) {
        return res.status(400).json({
          data: null,
          message: obraSocialFilters.error,
        });
      }

      const filters = {
        ...buildUsuarioScopeFilter(req.user?.role, req.user?._id),
        ...dateFilters.filters,
        ...statusFilters.filters,
        ...obraSocialFilters.filters,
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
      const obraSocialFilters = buildObraSocialFilter(typeof req.query.obraSocial === "string" ? req.query.obraSocial : undefined);

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

      if ("error" in obraSocialFilters) {
        return res.status(400).json({
          data: null,
          message: obraSocialFilters.error,
        });
      }

      const atenciones = await Atencion.find({
        ...buildUsuarioScopeFilter(req.user?.role, req.user?._id),
        ...dateFilters.filters,
        ...statusFilters.filters,
        ...obraSocialFilters.filters,
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

      const codigoAtencion = atencion.codigos.find((item) => getCodigoObjectIdString(item.codigo) === codigoId);

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

  static updateLiquidacionItem = async (req: Request, res: Response) => {
    const { idAtencion, codigoId } = req.params;
    const { status, valor } = req.body;

    try {
      const atencion = await Atencion.findById(idAtencion)
        .populate("paciente")
        .populate("usuario")
        .populate("obraSocial")
        .populate("codigos.codigo");

      if (!atencion) {
        return res.status(404).json({
          data: null,
          message: "Atención no encontrada",
        });
      }

      const codigoAtencion = atencion.codigos.find((item) => getCodigoObjectIdString(item.codigo) === codigoId);

      if (!codigoAtencion) {
        return res.status(404).json({
          data: null,
          message: "Código de atención no encontrado",
        });
      }

      codigoAtencion.status = status;
      codigoAtencion.valor = Number(valor);
      await atencion.save();

      const codigoPopulado = atencion.codigos.find((item) => getCodigoObjectIdString(item.codigo) === codigoId);
      const codigoDocumento = codigoPopulado?.codigo as unknown as { _id: string; code: string; description: string } | undefined;
      const usuario = atencion.usuario as unknown as { _id: string; name: string; lastName: string };
      const paciente = atencion.paciente as unknown as { dni: number; name: string; lastName: string };
      const obraSocial = atencion.obraSocial as unknown as { _id: string; name: string };

      return res.status(200).json({
        data: {
          atencionId: String(atencion._id),
          codigoId: String(codigoId),
          fecha: atencion.fecha,
          usuario: {
            _id: String(usuario._id),
            name: usuario.name,
            lastName: usuario.lastName,
          },
          paciente: {
            dni: paciente.dni,
            name: paciente.name,
            lastName: paciente.lastName,
          },
          obraSocial: {
            _id: String(obraSocial._id),
            name: obraSocial.name,
          },
          codigoAtencion: {
            _id: String(codigoDocumento?._id ?? codigoId),
            code: codigoDocumento?.code ?? "",
            description: codigoDocumento?.description ?? "",
          },
          status: codigoAtencion.status,
          valor: codigoAtencion.valor ?? 0,
        },
        message: "Liquidación actualizada correctamente",
      });
    } catch (error) {
      logError("AtencionController.updateLiquidacionItem");
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
