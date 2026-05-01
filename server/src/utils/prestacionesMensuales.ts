import { Types } from "mongoose";
import Atencion from "../models/Atencion";
import ObraSocial from "../models/ObraSocial";
import Paciente from "../models/Paciente";

type PrestacionesMensualesParams = {
  pacienteId: string;
  obraSocialId?: string;
  fecha?: string;
};

type PrestacionesMensualesContext = {
  obraSocialId: string;
  obraSocialNombre: string;
  limiteMensual: number | null;
  mes: number;
  anio: number;
  fechaReferencia: string;
  inicioMes: string;
  finMesExclusivo: string;
};

export type DisponibilidadPrestacionesResponse = {
  tieneLimiteConfigurado: boolean;
  obraSocialId: string;
  obraSocialNombre: string;
  limiteMensual: number | null;
  utilizadas: number;
  disponibles: number | null;
  mes: number;
  anio: number;
  fechaReferencia: string;
};

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

const isValidFecha = (value?: string) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.trim());

export const getMonthRangeFromFecha = (fecha?: string) => {
  const referenceDate = isValidFecha(fecha) ? new Date(`${fecha}T00:00:00.000Z`) : new Date();

  if (Number.isNaN(referenceDate.getTime())) {
    throw new Error("La fecha de atención no es válida");
  }

  const anio = referenceDate.getUTCFullYear();
  const mes = referenceDate.getUTCMonth() + 1;
  const inicioMes = `${anio}-${String(mes).padStart(2, "0")}-01`;
  const siguienteMesDate = new Date(Date.UTC(anio, mes, 1));
  const finMesExclusivo = `${siguienteMesDate.getUTCFullYear()}-${String(siguienteMesDate.getUTCMonth() + 1).padStart(2, "0")}-01`;

  return {
    anio,
    mes,
    inicioMes,
    finMesExclusivo,
    fechaReferencia: isValidFecha(fecha) ? fecha!.trim() : new Date().toISOString().slice(0, 10),
  };
};

const resolvePrestacionesContext = async ({ pacienteId, obraSocialId, fecha }: PrestacionesMensualesParams): Promise<PrestacionesMensualesContext> => {
  let obraSocialIdResolved = obraSocialId?.trim();

  if (!obraSocialIdResolved) {
    const paciente = await Paciente.findById(pacienteId).select("obraSocial").lean();

    if (!paciente?.obraSocial) {
      throw new Error("No se pudo determinar la obra social del paciente");
    }

    obraSocialIdResolved = String(paciente.obraSocial);
  }

  const obraSocial = await ObraSocial.findById(obraSocialIdResolved).select("name limitePrestacionesMensuales").lean();

  if (!obraSocial) {
    throw new Error("Obra Social no encontrada");
  }

  const { anio, mes, inicioMes, finMesExclusivo, fechaReferencia } = getMonthRangeFromFecha(fecha);

  return {
    obraSocialId: obraSocialIdResolved,
    obraSocialNombre: obraSocial.name,
    limiteMensual: normalizeLimitePrestacionesMensuales(obraSocial.limitePrestacionesMensuales),
    mes,
    anio,
    fechaReferencia,
    inicioMes,
    finMesExclusivo,
  };
};

export const countPrestacionesUtilizadas = async ({
  pacienteId,
  obraSocialId,
  fecha,
}: PrestacionesMensualesParams) => {
  const context = await resolvePrestacionesContext({ pacienteId, obraSocialId, fecha });

  const result = await Atencion.aggregate<{ total: number }>([
    {
      $match: {
        paciente: new Types.ObjectId(pacienteId),
        obraSocial: new Types.ObjectId(context.obraSocialId),
        fecha: {
          $gte: context.inicioMes,
          $lt: context.finMesExclusivo,
        },
      },
    },
    {
      $project: {
        cantidadCodigos: { $size: { $ifNull: ["$codigos", []] } },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$cantidadCodigos" },
      },
    },
  ]);

  return {
    ...context,
    utilizadas: result[0]?.total ?? 0,
  };
};

export const getDisponibilidadPrestaciones = async (params: PrestacionesMensualesParams): Promise<DisponibilidadPrestacionesResponse> => {
  const resumen = await countPrestacionesUtilizadas(params);
  const tieneLimiteConfigurado = typeof resumen.limiteMensual === "number" && resumen.limiteMensual > 0;

  return {
    obraSocialId: resumen.obraSocialId,
    obraSocialNombre: resumen.obraSocialNombre,
    limiteMensual: resumen.limiteMensual,
    tieneLimiteConfigurado,
    utilizadas: tieneLimiteConfigurado ? resumen.utilizadas : 0,
    disponibles: tieneLimiteConfigurado && resumen.limiteMensual !== null ? Math.max(resumen.limiteMensual - resumen.utilizadas, 0) : null,
    mes: resumen.mes,
    anio: resumen.anio,
    fechaReferencia: resumen.fechaReferencia,
  };
};

export const validatePrestacionesDisponibles = async ({
  pacienteId,
  obraSocialId,
  fecha,
  cantidadNuevosCodigos,
}: PrestacionesMensualesParams & { cantidadNuevosCodigos: number }) => {
  const disponibilidad = await getDisponibilidadPrestaciones({ pacienteId, obraSocialId, fecha });

  if (!disponibilidad.tieneLimiteConfigurado || disponibilidad.limiteMensual === null) {
    return {
      disponibilidad,
      excedeLimite: false,
      message: null,
    };
  }

  const totalProyectado = disponibilidad.utilizadas + cantidadNuevosCodigos;
  const excedeLimite = totalProyectado > disponibilidad.limiteMensual;

  if (!excedeLimite) {
    return {
      disponibilidad,
      excedeLimite: false,
      message: null,
    };
  }

  const disponiblesActuales = Math.max(disponibilidad.limiteMensual - disponibilidad.utilizadas, 0);
  const prestacionesRestantesTexto =
    disponiblesActuales === 1 ? "Solo puede cargar 1 prestación más." : `Solo puede cargar ${disponiblesActuales} prestaciones más.`;

  return {
    disponibilidad,
    excedeLimite: true,
    message: `El paciente ya utilizó ${disponibilidad.utilizadas} de ${disponibilidad.limiteMensual} prestaciones disponibles para ${disponibilidad.obraSocialNombre.toUpperCase()} en ${String(disponibilidad.mes).padStart(2, "0")}/${disponibilidad.anio}. Le quedan ${disponiblesActuales}. ${prestacionesRestantesTexto}`,
  };
};
