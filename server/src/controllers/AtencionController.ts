import { Request, Response } from "express";
import mongoose, { ClientSession, Types } from "mongoose";
import Atencion from "../models/Atencion";
import Usuario from "../models/Usuario";
import ObraSocial from "../models/ObraSocial";
import PagoOdontologo from "../models/PagoOdontologo";
import { logError } from "../utils/logError";
import { reporteAtencionesDash } from "../utils/reports/reporte-atencionesDash";
import { reporteAtencionesGlobal } from "../utils/reports/reporte-atencionesGlobal";
import { getDisponibilidadPrestaciones, validatePrestacionesDisponibles } from "../utils/prestacionesMensuales";

const normalizeText = (value?: string | null) => (value ?? "").trim();
const validCodigoStatuses = ["OK", "Pendiente", "Denegado", "Diferido", "No cargado"] as const;
type CodigoStatus = (typeof validCodigoStatuses)[number];
const mongoIdRegex = /^[a-f\d]{24}$/i;
const LIQUIDACIONES_PAGE_SIZE = 50;
const COSEGUROS_PAGE_SIZE = 50;
const PAGOS_PAGE_SIZE = 50;
const toObjectId = (value: string) => new Types.ObjectId(value);
type LiquidacionBulkItemPayload = {
  idAtencion: string;
  codigoId: string;
  rowIndex: number;
  status: CodigoStatus;
  valor: number;
};
type CreatePagoOdontologoPayload = {
  usuario: string;
  periodoPago: string;
  items: Array<{ atencionId: string }>;
};

type CodigoEditableInput = {
  codigo: string;
  pieza?: string;
  valor?: number;
  coseguro?: number;
  status: CodigoStatus;
  observaciones?: string;
};
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

const buildPagoEstadoFilter = (rawPagoEstado?: string) => {
  const pagoEstado = typeof rawPagoEstado === "string" ? rawPagoEstado.trim() : "";

  if (!pagoEstado) {
    return { requested: null as boolean | null };
  }

  if (pagoEstado === "pagado") {
    return { requested: true };
  }

  if (pagoEstado === "no-pagado") {
    return { requested: false };
  }

  return { error: "El filtro de pago no es válido" };
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

const getCodigoStatus = (status?: string): CodigoStatus => {
  if (validCodigoStatuses.includes(status as CodigoStatus)) {
    return status as CodigoStatus;
  }

  return "Pendiente";
};

const getCodigoValor = (value?: number) => Number(value ?? 0);
const getCodigoCoseguro = (value?: number) => Number(value ?? 0);

const getCodigoEmpresaCoseguroTotal = (
  codigos: Array<{
    coseguro?: number;
  }> = [],
) => codigos.reduce((total, codigo) => total + getCodigoCoseguro(codigo.coseguro), 0);

const getCodigoMontoLiquidable = (
  codigos: Array<{
    valor?: number;
    status?: string;
  }> = [],
) => codigos.reduce((total, codigo) => total + (getCodigoStatus(codigo.status) === "OK" ? getCodigoValor(codigo.valor) : 0), 0);

const isCodigoPaid = (codigo: { pagadoOdonto?: boolean }) => codigo.pagadoOdonto === true;
const isCodigoLockedByPayment = (codigo: { pagadoOdonto?: boolean }) => isCodigoPaid(codigo);

const buildPagosEstadoFuenteFilter = (rawEstadoFuente?: string) => {
  const estadoFuente = typeof rawEstadoFuente === "string" ? rawEstadoFuente.trim() : "";

  if (!estadoFuente || estadoFuente === "OK+Pendiente") {
    return { requested: "OK+Pendiente" as const };
  }

  if (estadoFuente === "OK" || estadoFuente === "Pendiente" || estadoFuente === "todos-visibles") {
    return { requested: estadoFuente as "OK" | "Pendiente" | "todos-visibles" };
  }

  return { error: "El filtro de estado no es válido" };
};

const normalizeCodigoInput = (codigo: CodigoEditableInput, currentCodigo?: { pagadoOdonto?: boolean; pagadoOdontoAt?: string; pagadoOdontoPagoId?: Types.ObjectId; pagadoOdontoPeriodo?: string }) => ({
  codigo: codigo.codigo,
  pieza: normalizeText(codigo.pieza),
  valor: Number(codigo.valor ?? 0),
  coseguro: Number(codigo.coseguro ?? 0),
  status: getCodigoStatus(codigo.status),
  observaciones: normalizeText(codigo.observaciones) || undefined,
  pagadoOdonto: currentCodigo?.pagadoOdonto ?? false,
  pagadoOdontoAt: currentCodigo?.pagadoOdontoAt,
  pagadoOdontoPagoId: currentCodigo?.pagadoOdontoPagoId,
  pagadoOdontoPeriodo: currentCodigo?.pagadoOdontoPeriodo,
});

const hasLockedCodigoChanges = (
  currentCodigo: {
    codigo: unknown;
    pieza?: string;
    observaciones?: string;
    valor?: number;
    coseguro?: number;
    status?: string;
    pagadoOdonto?: boolean;
  },
  incomingCodigo?: CodigoEditableInput,
) => {
  if (!incomingCodigo) {
    return true;
  }

  return (
    String(getCodigoObjectIdString(currentCodigo.codigo)) !== String(incomingCodigo.codigo) ||
    normalizeText(currentCodigo.pieza) !== normalizeText(incomingCodigo.pieza) ||
    normalizeText(currentCodigo.observaciones) !== normalizeText(incomingCodigo.observaciones) ||
    getCodigoValor(currentCodigo.valor) !== Number(incomingCodigo.valor ?? 0) ||
    getCodigoCoseguro(currentCodigo.coseguro) !== Number(incomingCodigo.coseguro ?? 0) ||
    getCodigoStatus(currentCodigo.status) !== getCodigoStatus(incomingCodigo.status)
  );
};

const getPagableCodigos = (
  atencion: {
    codigos?: Array<{
      codigo: unknown;
      pieza?: string;
      valor?: number;
      coseguro?: number;
      status?: string;
      pagadoOdonto?: boolean;
    }>;
  },
) =>
  (atencion.codigos ?? [])
    .map((codigo, rowIndex) => ({ codigo, rowIndex }))
    .filter(({ codigo }) => getCodigoStatus(codigo.status) === "OK" && !isCodigoPaid(codigo));

const getCodigosByStatus = (
  atencion: {
    codigos?: Array<{
      status?: string;
      pagadoOdonto?: boolean;
    }>;
  },
) => {
  const counters = {
    okPagables: 0,
    okPagados: 0,
    pendientes: 0,
  };

  (atencion.codigos ?? []).forEach((codigo) => {
    const status = getCodigoStatus(codigo.status);
    if (status === "OK") {
      if (isCodigoPaid(codigo)) counters.okPagados += 1;
      else counters.okPagables += 1;
    }
    if (status === "Pendiente") {
      counters.pendientes += 1;
    }
  });

  return counters;
};

const getAtencionPagoSummary = (
  atencion: {
    coseguroOdonto?: number;
    odontologoPagos?: {
      coseguroOdontoPagado?: number;
    };
    codigos?: Array<{
      codigo: unknown;
      pieza?: string;
      valor?: number;
      coseguro?: number;
      status?: string;
      pagadoOdonto?: boolean;
    }>;
  },
) => {
  const pagableCodigos = getPagableCodigos(atencion);
  const montoAtencionPagable = pagableCodigos.reduce((total, item) => total + getCodigoValor(item.codigo.valor), 0);
  const totalCoseguroOdonto = Number(atencion.coseguroOdonto ?? 0);
  const coseguroOdontoPagado = Number(atencion.odontologoPagos?.coseguroOdontoPagado ?? 0);
  const montoCoseguroOdontoPagable = Math.max(totalCoseguroOdonto - coseguroOdontoPagado, 0);
  const resumen = getCodigosByStatus(atencion);

  return {
    pagableCodigos,
    montoAtencionPagable,
    montoCoseguroOdontoPagable,
    montoTotalPagable: montoAtencionPagable + montoCoseguroOdontoPagable,
    totalCoseguroEmpresa: getCodigoEmpresaCoseguroTotal(atencion.codigos ?? []),
    ...resumen,
  };
};

const getTodayDateString = () => new Date().toISOString().slice(0, 10);

const shouldIncludeAtencionInPagoFilter = (
  atencion: {
    codigos?: Array<{
      status?: string;
      pagadoOdonto?: boolean;
    }>;
  },
  requested: "OK" | "Pendiente" | "OK+Pendiente" | "todos-visibles",
) => {
  const { okPagables, okPagados, pendientes } = getCodigosByStatus(atencion);
  const hasVisibleOk = okPagables > 0 || okPagados > 0;

  if (requested === "OK") return okPagables > 0;
  if (requested === "Pendiente") return pendientes > 0;
  if (requested === "todos-visibles") return hasVisibleOk || pendientes > 0;
  return okPagables > 0 || pendientes > 0;
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
  static getCoseguros = async (req: Request, res: Response) => {
    try {
      const page = Math.max(Number(req.query.page) || 1, 1);
      const skip = (page - 1) * COSEGUROS_PAGE_SIZE;

      const [atenciones, total] = await Promise.all([
        Atencion.find({})
          .populate("paciente")
          .sort({ fecha: -1, _id: -1 })
          .skip(skip)
          .limit(COSEGUROS_PAGE_SIZE)
          .lean(),
        Atencion.countDocuments({}),
      ]);

      const filteredAtenciones = atenciones.filter((atencion) => {
        const totalCoseguroEmpresa = getCodigoEmpresaCoseguroTotal(atencion.codigos ?? []);
        return totalCoseguroEmpresa > 0 && Number(atencion.coseguroOdonto ?? 0) <= 0;
      });

      const totalPages = Math.ceil(total / COSEGUROS_PAGE_SIZE);

      return res.status(200).json({
        data: filteredAtenciones.map((atencion) => {
          const paciente = atencion.paciente as unknown as { dni: number; name: string; lastName: string };

          return {
            atencionId: String(atencion._id),
            fecha: atencion.fecha,
            paciente: {
              dni: paciente.dni,
              name: paciente.name,
              lastName: paciente.lastName,
            },
            coseguro: getCodigoEmpresaCoseguroTotal(atencion.codigos ?? []),
            coseguroOdonto: atencion.coseguroOdonto ?? 0,
          };
        }),
        pagination: {
          total,
          page,
          limit: COSEGUROS_PAGE_SIZE,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        message: "Listado de coseguros pendientes",
      });
    } catch (error) {
      logError("AtencionController.getCoseguros");
      console.error(error);
      return res.status(500).json({
        data: null,
        message: "Error del servidor",
      });
    }
  };

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

  static getPagosFilters = async (_req: Request, res: Response) => {
    try {
      const [years, usuarios] = await Promise.all([
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
        Usuario.find({ enable: true, role: "odontologo" }, "_id name lastName role").sort({ lastName: 1, name: 1 }).lean(),
      ]);

      return res.status(200).json({
        data: {
          availableYears: years.map((item) => Number(item._id)).filter((year) => Number.isInteger(year)),
          usuarios,
        },
        message: "Filtros disponibles para pagos",
      });
    } catch (error) {
      logError("AtencionController.getPagosFilters");
      console.error(error);
      return res.status(500).json({
        data: null,
        message: "Error del servidor",
      });
    }
  };

  static getPagosPendientes = async (req: Request, res: Response) => {
    try {
      const page = Math.max(Number(req.query.page) || 1, 1);
      const skip = (page - 1) * PAGOS_PAGE_SIZE;
      const usuario = typeof req.query.usuario === "string" ? req.query.usuario.trim() : "";
      const dateFilters = buildDateFilters(
        typeof req.query.year === "string" ? req.query.year : undefined,
        typeof req.query.month === "string" ? req.query.month : undefined,
      );
      const estadoFuenteFilter = buildPagosEstadoFuenteFilter(typeof req.query.estadoFuente === "string" ? req.query.estadoFuente : undefined);

      if ("error" in dateFilters) {
        return res.status(400).json({
          data: null,
          message: dateFilters.error,
        });
      }

      if ("error" in estadoFuenteFilter) {
        return res.status(400).json({
          data: null,
          message: estadoFuenteFilter.error,
        });
      }

      const filters = {
        usuario: toObjectId(usuario),
        ...dateFilters.filters,
      };

      const atenciones = await Atencion.find(filters)
        .populate("paciente")
        .populate("codigos.codigo")
        .sort({ fecha: -1, _id: -1 })
        .lean();

      const rows = atenciones
        .filter((atencion) => shouldIncludeAtencionInPagoFilter(atencion, estadoFuenteFilter.requested))
        .map((atencion) => {
          const paciente = atencion.paciente as unknown as { dni: number; name: string; lastName: string };
          const summary = getAtencionPagoSummary(atencion);
          const hasInconsistency = Number(atencion.odontologoPagos?.coseguroOdontoPagado ?? 0) > Number(atencion.coseguroOdonto ?? 0);

          return {
            atencionId: String(atencion._id),
            fecha: atencion.fecha,
            paciente: {
              dni: paciente.dni,
              name: paciente.name,
              lastName: paciente.lastName,
            },
            montoAtencionPagable: summary.montoAtencionPagable,
            montoCoseguroOdontoPagable: summary.montoCoseguroOdontoPagable,
            montoTotalPagable: summary.montoTotalPagable,
            totalCoseguroEmpresa: summary.totalCoseguroEmpresa,
            okPagables: summary.okPagables,
            okPagados: summary.okPagados,
            pendientes: summary.pendientes,
            hasInconsistency,
            selectable: summary.montoTotalPagable > 0 && !hasInconsistency,
          };
        });

      const paginatedRows = rows.slice(skip, skip + PAGOS_PAGE_SIZE);
      const total = rows.length;
      const totalPages = Math.ceil(total / PAGOS_PAGE_SIZE);

      return res.status(200).json({
        data: paginatedRows,
        pagination: {
          total,
          page,
          limit: PAGOS_PAGE_SIZE,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        message: "Listado de pagos pendientes",
      });
    } catch (error) {
      logError("AtencionController.getPagosPendientes");
      console.error(error);
      return res.status(500).json({
        data: null,
        message: "Error del servidor",
      });
    }
  };

  static createPagoOdontologo = async (req: Request, res: Response) => {
    const { usuario, periodoPago, items } = req.body as CreatePagoOdontologoPayload;
    const fechaPago = getTodayDateString();

    const runCreatePago = async (session?: ClientSession) => {
      const pagoItems = [];
      let totalAtencion = 0;
      let totalCoseguroOdonto = 0;

      for (const item of items) {
        const query = Atencion.findOne({ _id: item.atencionId, usuario });
        if (session) {
          query.session(session);
        }

        const atencion = await query.populate("paciente").populate("codigos.codigo");

        if (!atencion) {
          throw new Error(`Atención no encontrada: ${item.atencionId}`);
        }

        const summary = getAtencionPagoSummary(atencion);

        if (summary.montoTotalPagable <= 0) {
          continue;
        }

        const paciente = atencion.paciente as unknown as { dni: number; name: string; lastName: string };
        const codigosPagados = summary.pagableCodigos.map(({ codigo, rowIndex }) => {
          const codigoDocumento = codigo.codigo as unknown as { _id: Types.ObjectId; code?: string; description?: string };

          return {
            rowIndex,
            codigoId: new Types.ObjectId(getCodigoObjectIdString(codigoDocumento)),
            code: codigoDocumento?.code ?? "",
            description: codigoDocumento?.description ?? "",
            pieza: codigo.pieza ?? "",
            valor: getCodigoValor(codigo.valor),
            coseguro: getCodigoCoseguro(codigo.coseguro),
          };
        });

        const pagoItem = {
          atencion: atencion._id,
          fechaAtencion: atencion.fecha,
          paciente: {
            dni: paciente.dni,
            name: paciente.name,
            lastName: paciente.lastName,
          },
          codigosPagados,
          montoAtencionPagado: summary.montoAtencionPagable,
          montoCoseguroOdontoPagado: summary.montoCoseguroOdontoPagable,
          montoTotalPagado: summary.montoTotalPagable,
        };

        pagoItems.push({ atencion, item: pagoItem, summary });
        totalAtencion += summary.montoAtencionPagable;
        totalCoseguroOdonto += summary.montoCoseguroOdontoPagable;
      }

      if (!pagoItems.length) {
        throw new Error("No hay importes pendientes para pagar en las atenciones seleccionadas");
      }

      const pago = new PagoOdontologo({
        usuario,
        periodoPago,
        fechaPago,
        totalAtencion,
        totalCoseguroOdonto,
        totalGeneral: totalAtencion + totalCoseguroOdonto,
        items: pagoItems.map((entry) => entry.item),
      });

      if (session) {
        await pago.save({ session });
      } else {
        await pago.save();
      }

      for (const entry of pagoItems) {
        const { atencion, summary } = entry;

        summary.pagableCodigos.forEach(({ codigo, rowIndex }) => {
          atencion.codigos[rowIndex].pagadoOdonto = true;
          atencion.codigos[rowIndex].pagadoOdontoAt = fechaPago;
          atencion.codigos[rowIndex].pagadoOdontoPagoId = pago._id as Types.ObjectId;
          atencion.codigos[rowIndex].pagadoOdontoPeriodo = periodoPago;
          void codigo;
        });

        const currentCoseguroPagado = Number(atencion.odontologoPagos?.coseguroOdontoPagado ?? 0);
        atencion.odontologoPagos = {
          coseguroOdontoPagado: currentCoseguroPagado + summary.montoCoseguroOdontoPagable,
          totalPagado: Number(atencion.odontologoPagos?.totalPagado ?? 0) + summary.montoTotalPagable,
          lastPaidAt: fechaPago,
          lastPeriodoPago: periodoPago,
        };

        if (session) {
          await atencion.save({ session });
        } else {
          await atencion.save();
        }
      }

      return pago;
    };

    try {
      let pago;
      const session = await mongoose.startSession();

      try {
        await session.withTransaction(async () => {
          pago = await runCreatePago(session);
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Error del servidor";
        if (message.includes("Transaction numbers are only allowed") || message.includes("replica set")) {
          pago = await runCreatePago();
        } else {
          throw error;
        }
      } finally {
        await session.endSession();
      }

      return res.status(200).json({
        data: pago,
        message: "Pago al odontólogo registrado correctamente",
      });
    } catch (error) {
      logError("AtencionController.createPagoOdontologo");
      console.error(error);
      const message = error instanceof Error ? error.message : "Error del servidor";
      return res.status(400).json({
        data: null,
        message,
      });
    }
  };

  static getPagosByUsuario = async (req: Request, res: Response) => {
    const { idUsuario } = req.params;

    try {
      const pagos = await PagoOdontologo.find({ usuario: idUsuario }).sort({ fechaPago: -1, createdAt: -1 }).lean();

      return res.status(200).json({
        data: pagos,
        message: "Cuenta corriente del odontólogo",
      });
    } catch (error) {
      logError("AtencionController.getPagosByUsuario");
      console.error(error);
      return res.status(500).json({
        data: null,
        message: "Error del servidor",
      });
    }
  };

  static getPagoOdontologoById = async (req: Request, res: Response) => {
    const { idPago } = req.params;

    try {
      if (!mongoIdRegex.test(idPago)) {
        return res.status(400).json({
          data: null,
          message: "El pago no es válido",
        });
      }

      const pago = await PagoOdontologo.findById(idPago).populate("usuario", "name lastName role").lean();

      if (!pago) {
        return res.status(404).json({
          data: null,
          message: "Pago no encontrado",
        });
      }

      return res.status(200).json({
        data: pago,
        message: "Detalle de pago al odontólogo",
      });
    } catch (error) {
      logError("AtencionController.getPagoOdontologoById");
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
      const pagoEstadoFilter = buildPagoEstadoFilter(typeof req.query.pagoEstado === "string" ? req.query.pagoEstado : undefined);

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

      if ("error" in pagoEstadoFilter) {
        return res.status(400).json({
          data: null,
          message: pagoEstadoFilter.error,
        });
      }

      const matchFilters = {
        ...dateFilters.filters,
        ...obraSocialFilters.filters,
        ...usuarioFilters.filters,
      };

      const requestedStatus =
        "filters" in statusFilters && "codigos" in statusFilters.filters
          ? (statusFilters.filters.codigos as { $elemMatch: { status: CodigoStatus } }).$elemMatch.status
          : null;
      const requestedPagoEstado = pagoEstadoFilter.requested;

      const codigoElemMatch: Record<string, unknown> = {};
      if (requestedStatus) {
        codigoElemMatch.status = requestedStatus;
      }
      if (requestedPagoEstado !== null) {
        codigoElemMatch.pagadoOdonto = requestedPagoEstado;
      }

      const filters = {
        ...matchFilters,
        ...(Object.keys(codigoElemMatch).length > 0 ? { codigos: { $elemMatch: codigoElemMatch } } : {}),
      };

      const [atenciones, total] = await Promise.all([
        Atencion.find(filters)
          .populate("paciente")
          .populate("usuario")
          .populate("obraSocial")
          .populate("codigos.codigo")
          .sort({ fecha: -1, _id: -1 })
          .skip(skip)
          .limit(LIQUIDACIONES_PAGE_SIZE)
          .lean(),
        Atencion.countDocuments(filters),
      ]);

      const totalPages = Math.ceil(total / LIQUIDACIONES_PAGE_SIZE);

      return res.status(200).json({
        data:
          atenciones.map((atencion) => {
            const paciente = atencion.paciente as unknown as { dni: number; name: string; lastName: string };
            const usuario = atencion.usuario as unknown as { _id: string; name: string; lastName: string };
            const obraSocial = atencion.obraSocial as unknown as { _id: string; name: string };
            const codigos = (atencion.codigos ?? [])
              .map((codigo, rowIndex) => {
                const codigoDocumento = codigo.codigo as unknown as { _id: string; code: string; description: string };

                return {
                  codigoId: String(codigoDocumento._id),
                  rowIndex,
                  pieza: codigo.pieza ?? "",
                  codigoAtencion: {
                    _id: String(codigoDocumento._id),
                    code: codigoDocumento.code ?? "",
                    description: codigoDocumento.description ?? "",
                  },
                  status: codigo.status,
                  valor: codigo.valor ?? 0,
                  pagadoOdonto: codigo.pagadoOdonto === true,
                };
              })
              .filter((codigo) => {
                if (requestedStatus && codigo.status !== requestedStatus) return false;
                if (requestedPagoEstado !== null && codigo.pagadoOdonto !== requestedPagoEstado) return false;
                return true;
              });

            return {
              atencionId: String(atencion._id),
              fecha: atencion.fecha,
              paciente: {
                dni: paciente.dni,
                name: paciente.name,
                lastName: paciente.lastName,
              },
              usuario: {
                _id: String(usuario._id),
                name: usuario.name,
                lastName: usuario.lastName,
              },
              obraSocial: {
                _id: String(obraSocial._id),
                name: obraSocial.name,
              },
              codigos,
            };
          }) ?? [],
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

  static updateLiquidacionesBulk = async (req: Request, res: Response) => {
    const { items } = req.body as { items: LiquidacionBulkItemPayload[] };

    try {
      const touchedAtenciones = new Set<string>();

      for (const item of items) {
        const atencion = await Atencion.findById(item.idAtencion);

        if (!atencion) {
          return res.status(404).json({
            data: null,
            message: `Atención no encontrada: ${item.idAtencion}`,
          });
        }

        if (!Number.isInteger(item.rowIndex) || item.rowIndex < 0 || item.rowIndex >= atencion.codigos.length) {
          return res.status(404).json({
            data: null,
            message: `Fila de liquidación no encontrada en la atención ${item.idAtencion}`,
          });
        }

        const codigoAtencion = atencion.codigos[item.rowIndex];
        if (!codigoAtencion || getCodigoObjectIdString(codigoAtencion.codigo) !== item.codigoId) {
          return res.status(404).json({
            data: null,
            message: `Código de atención no encontrado en la atención ${item.idAtencion}`,
          });
        }

        codigoAtencion.status = item.status;
        codigoAtencion.valor = Number(item.valor);
        await atencion.save();
        touchedAtenciones.add(item.idAtencion);
      }

      return res.status(200).json({
        data: {
          updatedCount: items.length,
          atenciones: Array.from(touchedAtenciones),
        },
        message: "Liquidaciones actualizadas correctamente",
      });
    } catch (error) {
      logError("AtencionController.updateLiquidacionesBulk");
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
    const { fecha, paciente, usuario, obraSocial, codigos, observaciones, coseguroOdonto } = req.body;

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
        codigos: Array.isArray(codigos) ? codigos.map((codigo) => normalizeCodigoInput(codigo)) : [],
        observaciones,
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
    const { fecha, paciente, usuario, obraSocial, codigos, observaciones, coseguroOdonto } = req.body;

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
          if (codigoActual.status === "Pendiente" && !isCodigoLockedByPayment(codigoActual)) {
            return false;
          }

          return hasLockedCodigoChanges(codigoActual, codigos[index]);
        });

        if (intentoEditarCodigoAuditado) {
          return res.status(403).json({
            data: null,
            message: "Solo podés editar códigos en estado Pendiente",
          });
        }
      }

      const intentoEditarCodigoPagado = atencion.codigos.some((codigoActual, index) => isCodigoLockedByPayment(codigoActual) && hasLockedCodigoChanges(codigoActual, codigos[index]));

      if (intentoEditarCodigoPagado) {
        return res.status(409).json({
          data: null,
          message: "No se pueden modificar códigos ya pagados al odontólogo",
        });
      }

      atencion.fecha = fecha;
      atencion.paciente = paciente;
      atencion.usuario = usuario;
      atencion.obraSocial = obraSocial;
      atencion.codigos = codigos.map((codigo: CodigoEditableInput, index: number) => normalizeCodigoInput(codigo, atencion.codigos[index]));
      atencion.observaciones = observaciones;
      if (Number(coseguroOdonto ?? 0) < Number(atencion.odontologoPagos?.coseguroOdontoPagado ?? 0)) {
        return res.status(409).json({
          data: null,
          message: "El coseguro odontológico no puede ser menor a lo ya pagado",
        });
      }

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

      if (isCodigoLockedByPayment(codigoAtencion)) {
        return res.status(409).json({
          data: null,
          message: "No se puede cambiar el estado de un código ya pagado al odontólogo",
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
    const { rowIndex, status, valor } = req.body;

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

      const parsedRowIndex = Number(rowIndex);

      if (!Number.isInteger(parsedRowIndex) || parsedRowIndex < 0 || parsedRowIndex >= atencion.codigos.length) {
        return res.status(404).json({
          data: null,
          message: "Fila de liquidación no encontrada",
        });
      }

      const codigoAtencion = atencion.codigos[parsedRowIndex];

      if (!codigoAtencion || getCodigoObjectIdString(codigoAtencion.codigo) !== codigoId) {
        return res.status(404).json({
          data: null,
          message: "Código de atención no encontrado",
        });
      }

      if (isCodigoLockedByPayment(codigoAtencion)) {
        return res.status(409).json({
          data: null,
          message: "No se puede modificar un código ya pagado al odontólogo",
        });
      }

      codigoAtencion.status = status;
      codigoAtencion.valor = Number(valor);
      await atencion.save();

      const codigoPopulado = atencion.codigos[parsedRowIndex];
      const codigoDocumento = codigoPopulado?.codigo as unknown as { _id: string; code: string; description: string } | undefined;
      const usuario = atencion.usuario as unknown as { _id: string; name: string; lastName: string };
      const paciente = atencion.paciente as unknown as { dni: number; name: string; lastName: string };
      const obraSocial = atencion.obraSocial as unknown as { _id: string; name: string };

      return res.status(200).json({
        data: {
          atencionId: String(atencion._id),
          codigoId: String(codigoId),
          rowIndex: parsedRowIndex,
          fecha: atencion.fecha,
          pieza: codigoAtencion.pieza ?? "",
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

  static updateCoseguroOdonto = async (req: Request, res: Response) => {
    const { idAtencion } = req.params;
    const { coseguroOdonto } = req.body;

    try {
      const atencion = await Atencion.findById(idAtencion).populate("paciente");

      if (!atencion) {
        return res.status(404).json({
          data: null,
          message: "Atención no encontrada",
        });
      }

      if (Number(coseguroOdonto) < Number(atencion.odontologoPagos?.coseguroOdontoPagado ?? 0)) {
        return res.status(409).json({
          data: null,
          message: "El coseguro odontológico no puede ser menor a lo ya pagado",
        });
      }

      atencion.coseguroOdonto = Number(coseguroOdonto);
      await atencion.save();

      return res.status(200).json({
        data: {
          atencionId: String(atencion._id),
          fecha: atencion.fecha,
          paciente: {
            dni: ((atencion.paciente as unknown as { dni: number }).dni ?? 0),
            name: ((atencion.paciente as unknown as { name: string }).name ?? ""),
            lastName: ((atencion.paciente as unknown as { lastName: string }).lastName ?? ""),
          },
          coseguro: getCodigoEmpresaCoseguroTotal(atencion.codigos ?? []),
          coseguroOdonto: atencion.coseguroOdonto ?? 0,
        },
        message: "Coseguro odontológico actualizado correctamente",
      });
    } catch (error) {
      logError("AtencionController.updateCoseguroOdonto");
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
        .select("fecha coseguroOdonto odontologoPagos usuario codigos")
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
