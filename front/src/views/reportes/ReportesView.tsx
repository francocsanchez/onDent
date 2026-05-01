import { getAtencionesByUsuario, getAtencionesGlobalReport } from "@/api/atencioneAPI";
import { getUsuarios } from "@/api/usuarioAPI";
import type { AtencionStatusCounter } from "@/types/index";
import LoadingSpinner from "@/components/LoadingSpinner";
import { getYearMonthFromDateOnly } from "@/utils/date";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, BarChart3, CircleDollarSign, FileStack, Stethoscope, UserRound, WalletCards } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

type ResumenMensualItem = {
  periodo: string;
  anio: number;
  mes: number;
  montoAtencion: number;
  montoCoseguro: number;
  montoTotal: number;
  ok: number;
  pendiente: number;
  denegado: number;
  diferido: number;
  noCargado: number;
};

type StatusKey = keyof AtencionStatusCounter & string;

const statusConfig: { key: StatusKey; label: string; className: string }[] = [
  { key: "OK", label: "OK", className: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  { key: "Pendiente", label: "Pendiente", className: "bg-amber-50 text-amber-700 border border-amber-200" },
  { key: "Denegado", label: "Denegado", className: "bg-rose-50 text-rose-700 border border-rose-200" },
  { key: "Diferido", label: "Diferido", className: "bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200" },
  { key: "No cargado", label: "No cargado", className: "bg-gray-100 text-gray-700 border border-gray-200" },
];

const getMontoLiquidable = (
  codigos: {
    valor: number;
    status: "OK" | "Pendiente" | "Denegado" | "Diferido" | "No cargado";
  }[],
) => codigos.reduce((total, codigo) => total + (codigo.status === "OK" ? codigo.valor : 0), 0);

export default function ReportesView() {
  const [selectedUsuarioId, setSelectedUsuarioId] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const {
    data: usuarios,
    isError,
    isLoading,
  } = useQuery({
    queryKey: ["usuarios", "listar"],
    queryFn: getUsuarios,
  });

  const {
    data: globalReport,
    isError: isGlobalReportError,
    isLoading: isGlobalReportLoading,
  } = useQuery({
    queryKey: ["reportes", "atenciones", "global", selectedYear],
    queryFn: () => getAtencionesGlobalReport(selectedYear),
  });

  useEffect(() => {
    if (globalReport && globalReport.selectedYear !== selectedYear) {
      setSelectedYear(globalReport.selectedYear);
    }
  }, [globalReport, selectedYear]);

  const selectedUsuario = usuarios?.find((usuario) => usuario._id === selectedUsuarioId) ?? null;

  const {
    data: atencionesUsuario,
    isError: isAtencionesError,
    isLoading: isAtencionesLoading,
  } = useQuery({
    queryKey: ["atenciones", "usuario", selectedUsuarioId],
    queryFn: () => getAtencionesByUsuario(selectedUsuarioId!),
    enabled: !!selectedUsuarioId,
  });

  const resumenMensual = useMemo<ResumenMensualItem[]>(() => {
    if (!atencionesUsuario) return [];

    const resumenMensualMap = new Map<string, ResumenMensualItem>();

    atencionesUsuario.forEach((atencion) => {
      const dateParts = getYearMonthFromDateOnly(atencion.fecha);
      if (!dateParts) return;

      const year = dateParts.year;
      const month = dateParts.month;
      const periodo = `${year}-${String(month).padStart(2, "0")}`;

      const resumenActual = resumenMensualMap.get(periodo) ?? {
        periodo,
        anio: year,
        mes: month,
        montoAtencion: 0,
        montoCoseguro: 0,
        montoTotal: 0,
        ok: 0,
        pendiente: 0,
        denegado: 0,
        diferido: 0,
        noCargado: 0,
      };

      resumenActual.montoAtencion += getMontoLiquidable(atencion.codigos);
      resumenActual.montoCoseguro += atencion.coseguroOdonto ?? 0;
      resumenActual.montoTotal = resumenActual.montoAtencion + resumenActual.montoCoseguro;

      atencion.codigos.forEach((codigo) => {
        if (codigo.status === "OK") resumenActual.ok += 1;
        if (codigo.status === "Pendiente") resumenActual.pendiente += 1;
        if (codigo.status === "Denegado") resumenActual.denegado += 1;
        if (codigo.status === "Diferido") resumenActual.diferido += 1;
        if (codigo.status === "No cargado") resumenActual.noCargado += 1;
      });

      resumenMensualMap.set(periodo, resumenActual);
    });

    return Array.from(resumenMensualMap.values()).sort((a, b) => b.periodo.localeCompare(a.periodo));
  }, [atencionesUsuario]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    }).format(value);

  const formatMonthLabel = (anio: number, mes: number) =>
    new Date(anio, mes - 1, 1).toLocaleDateString("es-AR", {
      month: "long",
    });

  const getStatusLink = (status: "OK" | "Pendiente" | "Denegado" | "Diferido" | "No cargado", periodo: string, idUsuario: string) =>
    `/reports/atenciones/${encodeURIComponent(status)}/${idUsuario}?periodo=${periodo}`;

  const getGlobalAtencionesLink = (params?: {
    year?: number;
    month?: number;
    status?: "OK" | "Pendiente" | "Denegado" | "Diferido" | "No cargado";
  }) => {
    const query = new URLSearchParams();

    if (params?.year) {
      query.set("year", String(params.year));
    }

    if (params?.month) {
      query.set("month", String(params.month).padStart(2, "0"));
    }

    if (params?.status) {
      query.set("status", params.status);
    }

    const queryString = query.toString();
    return queryString ? `/atenciones?${queryString}` : "/atenciones";
  };

  if (isLoading) {
    return <LoadingSpinner label="Cargando usuarios para reportes..." />;
  }

  if (isError || !usuarios) {
    return (
      <>
        <div className="mb-6 flex flex-col gap-4 border-b border-secondary-dark/60 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Reportes</p>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Reportes</h2>
          </div>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          Ocurrió un error al cargar los usuarios.
        </div>
      </>
    );
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 border-b border-secondary-dark/60 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Reportes</p>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Panel de reportes</h2>
          <p className="mt-1 text-sm text-slate-500">Resumen global anual de todas las atenciones y reporte mensual por usuario.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="inline-flex w-fit items-center gap-2 rounded-2xl border border-secondary-dark/50 bg-secondary/30 px-4 py-3">
            <BadgeCheck className="h-4 w-4 text-primary" strokeWidth={2.2} />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Usuarios</p>
              <p className="text-lg font-semibold text-primary-dark">{usuarios.length}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-secondary-dark/50 bg-white px-4 py-3 shadow-sm">
            <label htmlFor="report-year" className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Año global
            </label>
            <select
              id="report-year"
              value={selectedYear}
              onChange={(event) => setSelectedYear(Number(event.target.value))}
              className="mt-2 rounded-xl border border-secondary-dark/60 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              {(globalReport?.availableYears.length ? globalReport.availableYears : [selectedYear]).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <section className="rounded-2xl border border-secondary-dark/60 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 border-b border-secondary-dark/40 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Resumen global {globalReport?.selectedYear ?? selectedYear}</h3>
            <p className="mt-1 text-sm text-slate-500">Incluye cantidad por estado, montos, ranking de consultas y producción por odontólogo.</p>
          </div>
        </div>

        {isGlobalReportLoading ? <LoadingSpinner label="Cargando resumen global..." className="min-h-[220px]" /> : null}

        {!isGlobalReportLoading && isGlobalReportError ? (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            Ocurrió un error al cargar el resumen global de atenciones.
          </div>
        ) : null}

        {!isGlobalReportLoading && !isGlobalReportError && globalReport ? (
          <div className="mt-5 space-y-6">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Link
                to={getGlobalAtencionesLink({ year: globalReport.selectedYear })}
                className="rounded-2xl border border-secondary-dark/50 bg-secondary/20 p-4 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-white p-2 text-primary shadow-sm">
                    <FileStack className="h-4 w-4" strokeWidth={2.1} />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Cantidad de atenciones</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900">{globalReport.resumenAnual.cantidadAtenciones}</p>
                  </div>
                </div>
              </Link>

              <Link
                to={getGlobalAtencionesLink({ year: globalReport.selectedYear })}
                className="rounded-2xl border border-secondary-dark/50 bg-secondary/20 p-4 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-white p-2 text-primary shadow-sm">
                    <CircleDollarSign className="h-4 w-4" strokeWidth={2.1} />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">$ Atención</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900">{formatCurrency(globalReport.resumenAnual.montoAtencion)}</p>
                  </div>
                </div>
              </Link>

              <Link
                to={getGlobalAtencionesLink({ year: globalReport.selectedYear })}
                className="rounded-2xl border border-secondary-dark/50 bg-secondary/20 p-4 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-white p-2 text-primary shadow-sm">
                    <WalletCards className="h-4 w-4" strokeWidth={2.1} />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">$ Coseguro Odonto</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900">{formatCurrency(globalReport.resumenAnual.montoCoseguroOdonto)}</p>
                  </div>
                </div>
              </Link>

              <Link
                to={getGlobalAtencionesLink({ year: globalReport.selectedYear })}
                className="rounded-2xl border border-primary/20 bg-primary/5 p-4 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-white p-2 text-primary shadow-sm">
                    <BarChart3 className="h-4 w-4" strokeWidth={2.1} />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">$ Total</p>
                    <p className="mt-1 text-2xl font-semibold text-primary-dark">{formatCurrency(globalReport.resumenAnual.montoTotal)}</p>
                  </div>
                </div>
              </Link>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <div className="rounded-2xl border border-secondary-dark/50 bg-secondary/10 p-4">
                <h4 className="text-sm font-semibold text-slate-900">Cantidad por estado</h4>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {statusConfig.map((status) => (
                    <Link
                      key={status.key}
                      to={getGlobalAtencionesLink({ year: globalReport.selectedYear, status: status.key })}
                      className={`rounded-xl px-4 py-3 transition hover:-translate-y-0.5 hover:shadow-sm ${status.className}`}
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em]">{status.label}</p>
                      <p className="mt-2 text-xl font-semibold">{globalReport.resumenAnual.cantidadPorEstado[status.key]}</p>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-secondary-dark/50 bg-secondary/10 p-4">
                <h4 className="text-sm font-semibold text-slate-900">$ por estado</h4>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {statusConfig.map((status) => (
                    <Link
                      key={status.key}
                      to={getGlobalAtencionesLink({ year: globalReport.selectedYear, status: status.key })}
                      className={`rounded-xl px-4 py-3 transition hover:-translate-y-0.5 hover:shadow-sm ${status.className}`}
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em]">{status.label}</p>
                      <p className="mt-2 text-base font-semibold">{formatCurrency(globalReport.resumenAnual.montoPorEstado[status.key])}</p>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-3">
              <div className="rounded-2xl border border-secondary-dark/50 bg-white shadow-sm xl:col-span-1">
                <div className="border-b border-secondary-dark/40 px-5 py-4">
                  <h4 className="text-sm font-semibold text-slate-900">Top 5 mayor consulta</h4>
                  <p className="mt-1 text-xs text-slate-500">Prestaciones con mayor cantidad de ocurrencias.</p>
                </div>
                <div className="divide-y divide-secondary-dark/30">
                  {globalReport.resumenAnual.topConsultasCantidad.length > 0 ? (
                    globalReport.resumenAnual.topConsultasCantidad.map((item) => (
                      <div key={item.codigoId} className="px-5 py-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900">{item.code}</p>
                            <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                          </div>
                          <span className="shrink-0 rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-primary-dark">{item.cantidad}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="px-5 py-6 text-sm text-slate-500">No hay consultas registradas para el año seleccionado.</p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-secondary-dark/50 bg-white shadow-sm xl:col-span-1">
                <div className="border-b border-secondary-dark/40 px-5 py-4">
                  <h4 className="text-sm font-semibold text-slate-900">Top 5 mayor $ consulta</h4>
                  <p className="mt-1 text-xs text-slate-500">Prestaciones con mayor monto acumulado.</p>
                </div>
                <div className="divide-y divide-secondary-dark/30">
                  {globalReport.resumenAnual.topConsultasMonto.length > 0 ? (
                    globalReport.resumenAnual.topConsultasMonto.map((item) => (
                      <div key={item.codigoId} className="px-5 py-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900">{item.code}</p>
                            <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                          </div>
                          <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary-dark">
                            {formatCurrency(item.montoTotal)}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="px-5 py-6 text-sm text-slate-500">No hay montos registrados para el año seleccionado.</p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-secondary-dark/50 bg-white shadow-sm xl:col-span-1">
                <div className="border-b border-secondary-dark/40 px-5 py-4">
                  <h4 className="text-sm font-semibold text-slate-900">$ por odontólogo</h4>
                  <p className="mt-1 text-xs text-slate-500">Ordenado por monto total anual.</p>
                </div>
                <div className="divide-y divide-secondary-dark/30">
                  {globalReport.resumenAnual.montoPorUsuario.length > 0 ? (
                    globalReport.resumenAnual.montoPorUsuario.map((item) => (
                      <div key={item.usuarioId} className="px-5 py-4">
                        <div className="flex items-start gap-3">
                          <div className="rounded-xl bg-secondary p-2 text-primary">
                            <Stethoscope className="h-4 w-4" strokeWidth={2.1} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-sm font-semibold uppercase text-slate-900">{item.nombre}</p>
                              <p className="text-sm font-semibold text-primary-dark">{formatCurrency(item.montoTotal)}</p>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                              {item.cantidadAtenciones} atenciones | Atención {formatCurrency(item.montoAtencion)} | Coseguro {formatCurrency(item.montoCoseguroOdonto)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="px-5 py-6 text-sm text-slate-500">No hay producción por usuario para el año seleccionado.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-secondary-dark/50 bg-white shadow-sm">
              <div className="border-b border-secondary-dark/40 px-5 py-4">
                <h4 className="text-sm font-semibold text-slate-900">Resumen mensual global</h4>
                <p className="mt-1 text-xs text-slate-500">Desglose del año seleccionado por mes, cantidad de atenciones, estados y montos.</p>
              </div>

              {globalReport.resumenMensual.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="border-b border-secondary-dark/50 bg-secondary/40">
                      <tr>
                        <th className="px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-dark/80">Mes</th>
                        <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-dark/80">Atenciones</th>
                        <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-800">OK</th>
                        <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-800">Pend</th>
                        <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-rose-800">Den</th>
                        <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-fuchsia-800">Dif</th>
                        <th className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-700">NC</th>
                        <th className="px-4 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-dark/80">$ Atención</th>
                        <th className="px-4 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-dark/80">$ Coseguro</th>
                        <th className="px-4 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-dark/80">$ Total</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-secondary-dark/40">
                      {globalReport.resumenMensual.map((item) => (
                        <tr key={item.periodo} className="transition-colors hover:bg-secondary/20">
                          <td className="whitespace-nowrap px-4 py-5">
                            <p className="text-sm font-semibold capitalize text-slate-900">{formatMonthLabel(item.anio, item.mes)}</p>
                            <p className="text-xs text-slate-500">{item.anio}</p>
                          </td>
                          <td className="px-4 py-5 text-center text-sm font-semibold text-slate-800">
                            <Link to={getGlobalAtencionesLink({ year: item.anio, month: item.mes })} className="transition hover:text-primary-dark">
                              {item.cantidadAtenciones}
                            </Link>
                          </td>
                          <td className="px-4 py-5 text-center text-sm font-semibold text-emerald-700">
                            <Link to={getGlobalAtencionesLink({ year: item.anio, month: item.mes, status: "OK" })} className="transition hover:text-emerald-900">
                              {item.cantidadPorEstado.OK}
                            </Link>
                          </td>
                          <td className="px-4 py-5 text-center text-sm font-semibold text-amber-700">
                            <Link to={getGlobalAtencionesLink({ year: item.anio, month: item.mes, status: "Pendiente" })} className="transition hover:text-amber-900">
                              {item.cantidadPorEstado.Pendiente}
                            </Link>
                          </td>
                          <td className="px-4 py-5 text-center text-sm font-semibold text-rose-700">
                            <Link to={getGlobalAtencionesLink({ year: item.anio, month: item.mes, status: "Denegado" })} className="transition hover:text-rose-900">
                              {item.cantidadPorEstado.Denegado}
                            </Link>
                          </td>
                          <td className="px-4 py-5 text-center text-sm font-semibold text-fuchsia-700">
                            <Link to={getGlobalAtencionesLink({ year: item.anio, month: item.mes, status: "Diferido" })} className="transition hover:text-fuchsia-900">
                              {item.cantidadPorEstado.Diferido}
                            </Link>
                          </td>
                          <td className="px-4 py-5 text-center text-sm font-semibold text-gray-700">
                            <Link to={getGlobalAtencionesLink({ year: item.anio, month: item.mes, status: "No cargado" })} className="transition hover:text-gray-900">
                              {item.cantidadPorEstado["No cargado"]}
                            </Link>
                          </td>
                          <td className="whitespace-nowrap px-4 py-5 text-right text-sm font-medium text-slate-800">{formatCurrency(item.montoAtencion)}</td>
                          <td className="whitespace-nowrap px-4 py-5 text-right text-sm font-medium text-slate-800">
                            {formatCurrency(item.montoCoseguroOdonto)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-5 text-right text-sm font-semibold text-primary-dark">{formatCurrency(item.montoTotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="px-5 py-8 text-center">
                  <p className="text-sm font-medium text-slate-700">No hay atenciones registradas para el año seleccionado.</p>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </section>

      <section className="mt-8">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Reportes por usuario</h3>
          <p className="text-sm text-slate-500">Seleccioná un usuario para consultar el resumen mensual de sus atenciones.</p>
        </div>

        <section className="grid gap-3 sm:grid-cols-3 xl:grid-cols-5">
          {usuarios.map((usuario) => {
            const isSelected = usuario._id === selectedUsuarioId;

            return (
              <button
                key={usuario._id}
                type="button"
                onClick={() => setSelectedUsuarioId(usuario._id)}
                className={`group flex items-center gap-3 rounded-2xl border bg-white px-4 py-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
                  isSelected ? "border-primary ring-2 ring-primary/15" : "border-secondary-dark/60 hover:border-primary/30"
                }`}
              >
                <div
                  className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                    isSelected ? "bg-primary text-white" : "bg-secondary text-primary"
                  }`}
                >
                  <UserRound className="h-4.5 w-4.5" strokeWidth={2.1} />
                </div>

                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold capitalize text-slate-900">
                    {usuario.lastName} {usuario.name}
                  </h3>
                </div>
              </button>
            );
          })}
        </section>
      </section>

      {selectedUsuario ? (
        <section className="mt-8 rounded-2xl border border-secondary-dark/60 bg-white shadow-sm">
          <div className="border-b border-secondary-dark/50 px-6 py-5">
            <h3 className="text-lg font-semibold text-slate-900">Resumen mensual</h3>
            <p className="text-sm text-slate-500">
              Montos de atención, coseguro odontológico y cantidad de códigos por estado de {selectedUsuario.lastName} {selectedUsuario.name}.
            </p>
          </div>

          {isAtencionesLoading ? <LoadingSpinner label="Cargando atenciones del usuario..." className="min-h-[180px]" /> : null}

          {!isAtencionesLoading && isAtencionesError ? (
            <div className="px-6 py-5">
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                Ocurrió un error al cargar las atenciones del usuario.
              </div>
            </div>
          ) : null}

          {!isAtencionesLoading && !isAtencionesError && resumenMensual.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="border-b border-secondary-dark/50 bg-secondary/40">
                  <tr>
                    <th className="px-4 py-5 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-dark/80">Mes</th>
                    <th className="px-4 py-5 text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-dark/80">$ Atención</th>
                    <th className="px-4 py-5 text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-dark/80">$ Coseguro</th>
                    <th className="px-4 py-5 text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-dark/80">$ Total</th>
                    <th className="bg-emerald-100/80 px-4 py-5 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-800">OK</th>
                    <th className="bg-amber-100/90 px-4 py-5 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-800">Pend</th>
                    <th className="bg-rose-100/90 px-4 py-5 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-rose-800">Denegada</th>
                    <th className="bg-fuchsia-100/90 px-4 py-5 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-fuchsia-800">Diferida</th>
                    <th className="bg-gray-100 px-4 py-5 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-700">No cargado</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-secondary-dark/40">
                  {resumenMensual.map((item) => (
                    <tr key={item.periodo} className="transition-colors hover:bg-secondary/20">
                      <td className="whitespace-nowrap px-4 py-6">
                        <p className="text-sm font-semibold capitalize text-slate-800">{formatMonthLabel(item.anio, item.mes)}</p>
                        <p className="text-xs text-slate-500">{item.anio}</p>
                      </td>

                      <td className="whitespace-nowrap px-4 py-6 text-right">
                        <p className="text-sm font-medium text-slate-800">{formatCurrency(item.montoAtencion)}</p>
                      </td>

                      <td className="whitespace-nowrap px-4 py-6 text-right">
                        <p className="text-sm font-medium text-slate-800">{formatCurrency(item.montoCoseguro)}</p>
                      </td>

                      <td className="whitespace-nowrap px-4 py-6 text-right">
                        <p className="text-sm font-semibold text-primary-dark">{formatCurrency(item.montoTotal)}</p>
                      </td>

                      <td className="px-4 py-6 text-center">
                        <Link
                          to={getStatusLink("OK", item.periodo, selectedUsuario._id)}
                          className="inline-flex min-w-20 items-center justify-center rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                        >
                          {item.ok}
                        </Link>
                      </td>

                      <td className="px-4 py-6 text-center">
                        <Link
                          to={getStatusLink("Pendiente", item.periodo, selectedUsuario._id)}
                          className="inline-flex min-w-20 items-center justify-center rounded-full bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
                        >
                          {item.pendiente}
                        </Link>
                      </td>

                      <td className="px-4 py-6 text-center">
                        <Link
                          to={getStatusLink("Denegado", item.periodo, selectedUsuario._id)}
                          className="inline-flex min-w-20 items-center justify-center rounded-full bg-rose-50 px-3 py-1.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                        >
                          {item.denegado}
                        </Link>
                      </td>

                      <td className="px-4 py-6 text-center">
                        <Link
                          to={getStatusLink("Diferido", item.periodo, selectedUsuario._id)}
                          className="inline-flex min-w-20 items-center justify-center rounded-full bg-fuchsia-50 px-3 py-1.5 text-sm font-semibold text-fuchsia-700 transition hover:bg-fuchsia-100"
                        >
                          {item.diferido}
                        </Link>
                      </td>

                      <td className="px-4 py-6 text-center">
                        <Link
                          to={getStatusLink("No cargado", item.periodo, selectedUsuario._id)}
                          className="inline-flex min-w-20 items-center justify-center rounded-full bg-gray-100 px-3 py-1.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-200"
                        >
                          {item.noCargado}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {!isAtencionesLoading && !isAtencionesError && resumenMensual.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm font-medium text-slate-700">Este usuario no tiene atenciones registradas.</p>
            </div>
          ) : null}
        </section>
      ) : null}
    </>
  );
}
