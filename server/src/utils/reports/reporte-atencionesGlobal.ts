import { parseDateOnlyString } from "../date";

const validStatuses = ["OK", "Pendiente", "Denegado", "Diferido", "No cargado"] as const;

type AtencionStatus = (typeof validStatuses)[number];

type StatusCounter = Record<AtencionStatus, number>;

type AtencionGlobalCodigoItem = {
  valor?: number;
  status?: string;
  pagadoOdonto?: boolean;
  codigo?: {
    _id?: { toString(): string } | string;
    code?: string;
    description?: string;
  };
};

type AtencionGlobalUsuarioItem = {
  _id?: { toString(): string } | string;
  name?: string;
  lastName?: string;
};

type AtencionGlobalItem = {
  fecha?: string | Date;
  coseguroOdonto?: number;
  odontologoPagos?: {
    coseguroOdontoPagado?: number;
    totalPagado?: number;
  };
  usuario?: AtencionGlobalUsuarioItem;
  codigos?: AtencionGlobalCodigoItem[];
};

type TopConsultaItem = {
  codigoId: string;
  code: string;
  description: string;
  cantidad: number;
  montoTotal: number;
};

type MontoPorUsuarioItem = {
  usuarioId: string;
  nombre: string;
  cantidadAtenciones: number;
  montoAtencion: number;
  montoCoseguroOdonto: number;
  montoTotal: number;
  montoAtencionPagado: number;
  montoAtencionPendientePago: number;
  montoCoseguroOdontoPagado: number;
  montoCoseguroOdontoPendientePago: number;
  montoTotalPagado: number;
  montoTotalPendientePago: number;
};

type ResumenMensualGlobalItem = {
  periodo: string;
  anio: number;
  mes: number;
  cantidadAtenciones: number;
  cantidadPorEstado: StatusCounter;
  montoPorEstado: StatusCounter;
  montoAtencion: number;
  montoCoseguroOdonto: number;
  montoTotal: number;
  montoAtencionPagado: number;
  montoAtencionPendientePago: number;
  montoCoseguroOdontoPagado: number;
  montoCoseguroOdontoPendientePago: number;
  montoTotalPagado: number;
  montoTotalPendientePago: number;
};

type ResumenAnualGlobal = {
  cantidadAtenciones: number;
  cantidadPorEstado: StatusCounter;
  montoPorEstado: StatusCounter;
  montoPorUsuario: MontoPorUsuarioItem[];
  topConsultasCantidad: TopConsultaItem[];
  topConsultasMonto: TopConsultaItem[];
  montoAtencion: number;
  montoCoseguroOdonto: number;
  montoTotal: number;
  montoAtencionPagado: number;
  montoAtencionPendientePago: number;
  montoCoseguroOdontoPagado: number;
  montoCoseguroOdontoPendientePago: number;
  montoTotalPagado: number;
  montoTotalPendientePago: number;
};

export type AtencionesGlobalReport = {
  availableYears: number[];
  selectedYear: number;
  resumenAnual: ResumenAnualGlobal;
  resumenMensual: ResumenMensualGlobalItem[];
};

const createEmptyStatusCounter = (): StatusCounter => ({
  OK: 0,
  Pendiente: 0,
  Denegado: 0,
  Diferido: 0,
  "No cargado": 0,
});

const getStatus = (value?: string): AtencionStatus => {
  return validStatuses.includes(value as AtencionStatus) ? (value as AtencionStatus) : "No cargado";
};

const getMontoLiquidable = (codigos: AtencionGlobalCodigoItem[] = []) =>
  codigos.reduce((total, codigo) => total + (getStatus(codigo.status) === "OK" ? (codigo.valor ?? 0) : 0), 0);

const getMontoAtencionPagado = (codigos: AtencionGlobalCodigoItem[] = []) =>
  codigos.reduce((total, codigo) => total + (getStatus(codigo.status) === "OK" && codigo.pagadoOdonto === true ? (codigo.valor ?? 0) : 0), 0);

const getMontoAtencionPendientePago = (codigos: AtencionGlobalCodigoItem[] = []) =>
  codigos.reduce((total, codigo) => total + (getStatus(codigo.status) === "OK" && codigo.pagadoOdonto !== true ? (codigo.valor ?? 0) : 0), 0);

export function reporteAtencionesGlobal(atenciones: AtencionGlobalItem[], requestedYear?: number): AtencionesGlobalReport {
  const datedAtenciones = atenciones
    .map((atencion) => ({
      atencion,
      date: parseDateOnlyString(atencion.fecha),
    }))
    .filter((item): item is { atencion: AtencionGlobalItem; date: Date } => item.date !== null);

  const availableYears = Array.from(new Set(datedAtenciones.map(({ date }) => date.getFullYear()))).sort((a, b) => b - a);
  const fallbackYear = availableYears[0] ?? new Date().getFullYear();
  const selectedYear = requestedYear ?? fallbackYear;

  const resumenAnual: ResumenAnualGlobal = {
    cantidadAtenciones: 0,
    cantidadPorEstado: createEmptyStatusCounter(),
    montoPorEstado: createEmptyStatusCounter(),
    montoPorUsuario: [],
    topConsultasCantidad: [],
    topConsultasMonto: [],
    montoAtencion: 0,
    montoCoseguroOdonto: 0,
    montoTotal: 0,
    montoAtencionPagado: 0,
    montoAtencionPendientePago: 0,
    montoCoseguroOdontoPagado: 0,
    montoCoseguroOdontoPendientePago: 0,
    montoTotalPagado: 0,
    montoTotalPendientePago: 0,
  };

  const resumenMensualMap = new Map<string, ResumenMensualGlobalItem>();
  const montoPorUsuarioMap = new Map<string, MontoPorUsuarioItem>();
  const topConsultasMap = new Map<string, TopConsultaItem>();

  datedAtenciones.forEach(({ atencion, date }) => {
    if (date.getFullYear() !== selectedYear) return;

    const mes = date.getMonth() + 1;
    const periodo = `${selectedYear}-${String(mes).padStart(2, "0")}`;
    const montoAtencion = getMontoLiquidable(atencion.codigos ?? []);
    const montoAtencionPagado = getMontoAtencionPagado(atencion.codigos ?? []);
    const montoAtencionPendientePago = getMontoAtencionPendientePago(atencion.codigos ?? []);
    const montoCoseguroOdonto = atencion.coseguroOdonto ?? 0;
    const montoCoseguroOdontoPagado = Number(atencion.odontologoPagos?.coseguroOdontoPagado ?? 0);
    const montoCoseguroOdontoPendientePago = Math.max(montoCoseguroOdonto - montoCoseguroOdontoPagado, 0);
    const montoTotal = montoAtencion + montoCoseguroOdonto;
    const montoTotalPagado = montoAtencionPagado + montoCoseguroOdontoPagado;
    const montoTotalPendientePago = montoAtencionPendientePago + montoCoseguroOdontoPendientePago;

    resumenAnual.cantidadAtenciones += 1;
    resumenAnual.montoAtencion += montoAtencion;
    resumenAnual.montoCoseguroOdonto += montoCoseguroOdonto;
    resumenAnual.montoTotal += montoTotal;
    resumenAnual.montoAtencionPagado += montoAtencionPagado;
    resumenAnual.montoAtencionPendientePago += montoAtencionPendientePago;
    resumenAnual.montoCoseguroOdontoPagado += montoCoseguroOdontoPagado;
    resumenAnual.montoCoseguroOdontoPendientePago += montoCoseguroOdontoPendientePago;
    resumenAnual.montoTotalPagado += montoTotalPagado;
    resumenAnual.montoTotalPendientePago += montoTotalPendientePago;

    const resumenMensualActual = resumenMensualMap.get(periodo) ?? {
      periodo,
      anio: selectedYear,
      mes,
      cantidadAtenciones: 0,
      cantidadPorEstado: createEmptyStatusCounter(),
      montoPorEstado: createEmptyStatusCounter(),
      montoAtencion: 0,
      montoCoseguroOdonto: 0,
      montoTotal: 0,
      montoAtencionPagado: 0,
      montoAtencionPendientePago: 0,
      montoCoseguroOdontoPagado: 0,
      montoCoseguroOdontoPendientePago: 0,
      montoTotalPagado: 0,
      montoTotalPendientePago: 0,
    };

    resumenMensualActual.cantidadAtenciones += 1;
    resumenMensualActual.montoAtencion += montoAtencion;
    resumenMensualActual.montoCoseguroOdonto += montoCoseguroOdonto;
    resumenMensualActual.montoTotal += montoTotal;
    resumenMensualActual.montoAtencionPagado += montoAtencionPagado;
    resumenMensualActual.montoAtencionPendientePago += montoAtencionPendientePago;
    resumenMensualActual.montoCoseguroOdontoPagado += montoCoseguroOdontoPagado;
    resumenMensualActual.montoCoseguroOdontoPendientePago += montoCoseguroOdontoPendientePago;
    resumenMensualActual.montoTotalPagado += montoTotalPagado;
    resumenMensualActual.montoTotalPendientePago += montoTotalPendientePago;

    const usuarioId = atencion.usuario?._id ? String(atencion.usuario._id) : "sin-usuario";
    const nombreUsuario = atencion.usuario ? `${atencion.usuario.lastName ?? ""} ${atencion.usuario.name ?? ""}`.trim() : "Sin usuario";
    const montoPorUsuarioActual = montoPorUsuarioMap.get(usuarioId) ?? {
      usuarioId,
      nombre: nombreUsuario,
      cantidadAtenciones: 0,
      montoAtencion: 0,
      montoCoseguroOdonto: 0,
      montoTotal: 0,
      montoAtencionPagado: 0,
      montoAtencionPendientePago: 0,
      montoCoseguroOdontoPagado: 0,
      montoCoseguroOdontoPendientePago: 0,
      montoTotalPagado: 0,
      montoTotalPendientePago: 0,
    };

    montoPorUsuarioActual.cantidadAtenciones += 1;
    montoPorUsuarioActual.montoAtencion += montoAtencion;
    montoPorUsuarioActual.montoCoseguroOdonto += montoCoseguroOdonto;
    montoPorUsuarioActual.montoTotal += montoTotal;
    montoPorUsuarioActual.montoAtencionPagado += montoAtencionPagado;
    montoPorUsuarioActual.montoAtencionPendientePago += montoAtencionPendientePago;
    montoPorUsuarioActual.montoCoseguroOdontoPagado += montoCoseguroOdontoPagado;
    montoPorUsuarioActual.montoCoseguroOdontoPendientePago += montoCoseguroOdontoPendientePago;
    montoPorUsuarioActual.montoTotalPagado += montoTotalPagado;
    montoPorUsuarioActual.montoTotalPendientePago += montoTotalPendientePago;
    montoPorUsuarioMap.set(usuarioId, montoPorUsuarioActual);

    (atencion.codigos ?? []).forEach((codigoItem) => {
      const status = getStatus(codigoItem.status);
      const valor = codigoItem.valor ?? 0;

      resumenAnual.cantidadPorEstado[status] += 1;
      resumenAnual.montoPorEstado[status] += valor;
      resumenMensualActual.cantidadPorEstado[status] += 1;
      resumenMensualActual.montoPorEstado[status] += valor;

      const codigoId =
        codigoItem.codigo?._id ? String(codigoItem.codigo._id) : `${codigoItem.codigo?.code ?? "SIN-CODIGO"}-${codigoItem.codigo?.description ?? ""}`;
      const topConsultaActual = topConsultasMap.get(codigoId) ?? {
        codigoId,
        code: codigoItem.codigo?.code ?? "Sin código",
        description: codigoItem.codigo?.description?.trim() ?? "Sin descripción",
        cantidad: 0,
        montoTotal: 0,
      };

      topConsultaActual.cantidad += 1;
      if (status === "OK") {
        topConsultaActual.montoTotal += valor;
      }
      topConsultasMap.set(codigoId, topConsultaActual);
    });

    resumenMensualMap.set(periodo, resumenMensualActual);
  });

  resumenAnual.montoPorUsuario = Array.from(montoPorUsuarioMap.values()).sort((a, b) => b.montoTotal - a.montoTotal || b.cantidadAtenciones - a.cantidadAtenciones);

  const topConsultas = Array.from(topConsultasMap.values());
  resumenAnual.topConsultasCantidad = [...topConsultas].sort((a, b) => b.cantidad - a.cantidad || b.montoTotal - a.montoTotal).slice(0, 5);
  resumenAnual.topConsultasMonto = [...topConsultas].sort((a, b) => b.montoTotal - a.montoTotal || b.cantidad - a.cantidad).slice(0, 5);

  const resumenMensual = Array.from(resumenMensualMap.values()).sort((a, b) => a.mes - b.mes);

  return {
    availableYears,
    selectedYear,
    resumenAnual,
    resumenMensual,
  };
}
