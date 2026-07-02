import { getAtencionesByUsuario, getAtencionesGlobalReport, getPagosByUsuario } from "@/api/atencioneAPI";
import { getUsuarios } from "@/api/usuarioAPI";
import LoadingSpinner from "@/components/LoadingSpinner";
import { getYearMonthFromDateOnly } from "@/utils/date";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

type ResumenMensualItem = {
  periodo: string;
  anio: number;
  mes: number;
  montoAtencion: number;
  montoCoseguro: number;
  montoTotal: number;
  montoAtencionPagado: number;
  montoAtencionPendientePago: number;
  montoCoseguroPagado: number;
  montoCoseguroPendientePago: number;
  montoTotalPagado: number;
  montoTotalPendientePago: number;
  ok: number;
  pendiente: number;
  denegado: number;
  diferido: number;
  noCargado: number;
};

const getMontoLiquidable = (
  codigos: {
    valor: number;
    status: "OK" | "Pendiente" | "Denegado" | "Diferido" | "No cargado";
    pagadoOdonto?: boolean;
  }[],
) => codigos.reduce((total, codigo) => total + (codigo.status === "OK" ? codigo.valor : 0), 0);

const getMontoPagado = (
  codigos: {
    valor: number;
    status: "OK" | "Pendiente" | "Denegado" | "Diferido" | "No cargado";
    pagadoOdonto?: boolean;
  }[],
) => codigos.reduce((total, codigo) => total + (codigo.status === "OK" && codigo.pagadoOdonto ? codigo.valor : 0), 0);

const getMontoPendientePago = (
  codigos: {
    valor: number;
    status: "OK" | "Pendiente" | "Denegado" | "Diferido" | "No cargado";
    pagadoOdonto?: boolean;
  }[],
) => codigos.reduce((total, codigo) => total + (codigo.status === "OK" && !codigo.pagadoOdonto ? codigo.valor : 0), 0);

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

  const { data: pagosUsuario, isLoading: isPagosLoading, isError: isPagosError } = useQuery({
    queryKey: ["pagos", "cuenta-corriente", selectedUsuarioId],
    queryFn: () => getPagosByUsuario(selectedUsuarioId!),
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
        montoAtencionPagado: 0,
        montoAtencionPendientePago: 0,
        montoCoseguroPagado: 0,
        montoCoseguroPendientePago: 0,
        montoTotalPagado: 0,
        montoTotalPendientePago: 0,
        ok: 0,
        pendiente: 0,
        denegado: 0,
        diferido: 0,
        noCargado: 0,
      };

      const montoAtencion = getMontoLiquidable(atencion.codigos);
      const montoAtencionPagado = getMontoPagado(atencion.codigos);
      const montoAtencionPendientePago = getMontoPendientePago(atencion.codigos);
      const montoCoseguro = atencion.coseguroOdonto ?? 0;
      const montoCoseguroPagado = atencion.odontologoPagos?.coseguroOdontoPagado ?? 0;
      const montoCoseguroPendientePago = Math.max(montoCoseguro - montoCoseguroPagado, 0);

      resumenActual.montoAtencion += montoAtencion;
      resumenActual.montoAtencionPagado += montoAtencionPagado;
      resumenActual.montoAtencionPendientePago += montoAtencionPendientePago;
      resumenActual.montoCoseguro += montoCoseguro;
      resumenActual.montoCoseguroPagado += montoCoseguroPagado;
      resumenActual.montoCoseguroPendientePago += montoCoseguroPendientePago;
      resumenActual.montoTotal = resumenActual.montoAtencion + resumenActual.montoCoseguro;
      resumenActual.montoTotalPagado = resumenActual.montoAtencionPagado + resumenActual.montoCoseguroPagado;
      resumenActual.montoTotalPendientePago = resumenActual.montoAtencionPendientePago + resumenActual.montoCoseguroPendientePago;

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
      <div className="mb-4 flex flex-col gap-3 border-b border-secondary-dark/60 pb-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Reportes</p>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Panel de reportes</h2>
          <p className="mt-1 text-sm text-slate-500">Resumen global anual de todas las atenciones y reporte mensual por usuario.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="inline-flex w-fit items-center gap-2 rounded-2xl border border-secondary-dark/50 bg-secondary/30 px-3 py-2">
            <BadgeCheck className="h-4 w-4 text-primary" strokeWidth={2.2} />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Usuarios</p>
              <p className="text-lg font-semibold text-primary-dark">{usuarios.length}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-secondary-dark/50 bg-white px-3 py-2 shadow-sm">
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

      <section>
        {isGlobalReportLoading ? <LoadingSpinner label="Cargando resumen global..." className="min-h-[220px]" /> : null}

        {!isGlobalReportLoading && isGlobalReportError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            Ocurrió un error al cargar el resumen global de atenciones.
          </div>
        ) : null}

        {!isGlobalReportLoading && !isGlobalReportError && globalReport ? (
          <div>
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-slate-900">Resumen mensual global</h4>
              <p className="mt-1 text-xs text-slate-500">Desglose del año seleccionado por mes, con estados, montos históricos, saldo pendiente de pago y monto ya abonado.</p>
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
                      <th className="px-4 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-800">$ Pendiente pago</th>
                      <th className="px-4 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-800">$ Ya pagado</th>
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
                        <td className="whitespace-nowrap px-4 py-5 text-right text-sm font-semibold text-amber-700">
                          {formatCurrency(item.montoTotalPendientePago)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-5 text-right text-sm font-semibold text-emerald-700">
                          {formatCurrency(item.montoTotalPagado)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-sm font-medium text-slate-700">No hay atenciones registradas para el año seleccionado.</p>
              </div>
            )}
          </div>
        ) : null}
      </section>

      <section className="mt-6">
        <div className="mb-3">
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
                className={`group flex items-center gap-3 rounded-2xl border bg-white px-3 py-2.5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
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
        <>
        <section className="mt-6 rounded-2xl border border-secondary-dark/60 bg-white shadow-sm">
          <div className="border-b border-secondary-dark/50 px-4 py-3">
            <h3 className="text-lg font-semibold text-slate-900">Resumen mensual</h3>
            <p className="text-sm text-slate-500">
              Montos históricos, saldo pendiente de pago y total ya abonado para {selectedUsuario.lastName} {selectedUsuario.name}.
            </p>
          </div>

          {isAtencionesLoading ? <LoadingSpinner label="Cargando atenciones del usuario..." className="min-h-[180px]" /> : null}

          {!isAtencionesLoading && isAtencionesError ? (
            <div className="px-4 py-3">
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
                    <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-dark/80">Mes</th>
                    <th className="px-3 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-dark/80">$ Atención</th>
                    <th className="px-3 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-dark/80">$ Coseguro</th>
                    <th className="px-3 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-dark/80">$ Total</th>
                    <th className="px-3 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-800">$ Pendiente pago</th>
                    <th className="px-3 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-800">$ Ya pagado</th>
                    <th className="bg-emerald-100/80 px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-800">OK</th>
                    <th className="bg-amber-100/90 px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-800">Pend</th>
                    <th className="bg-rose-100/90 px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-rose-800">Denegada</th>
                    <th className="bg-fuchsia-100/90 px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-fuchsia-800">Diferida</th>
                    <th className="bg-gray-100 px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-700">No cargado</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-secondary-dark/40">
                  {resumenMensual.map((item) => (
                    <tr key={item.periodo} className="transition-colors hover:bg-secondary/20">
                      <td className="whitespace-nowrap px-3 py-3.5">
                        <p className="text-sm font-semibold capitalize text-slate-800">{formatMonthLabel(item.anio, item.mes)}</p>
                        <p className="text-xs text-slate-500">{item.anio}</p>
                      </td>

                      <td className="whitespace-nowrap px-3 py-3.5 text-right">
                        <p className="text-sm font-medium text-slate-800">{formatCurrency(item.montoAtencion)}</p>
                      </td>

                      <td className="whitespace-nowrap px-3 py-3.5 text-right">
                        <p className="text-sm font-medium text-slate-800">{formatCurrency(item.montoCoseguro)}</p>
                      </td>

                      <td className="whitespace-nowrap px-3 py-3.5 text-right">
                        <p className="text-sm font-semibold text-primary-dark">{formatCurrency(item.montoTotal)}</p>
                      </td>

                      <td className="whitespace-nowrap px-3 py-3.5 text-right">
                        <p className="text-sm font-semibold text-amber-700">{formatCurrency(item.montoTotalPendientePago)}</p>
                      </td>

                      <td className="whitespace-nowrap px-3 py-3.5 text-right">
                        <p className="text-sm font-semibold text-emerald-700">{formatCurrency(item.montoTotalPagado)}</p>
                      </td>

                      <td className="px-3 py-3.5 text-center">
                        <Link
                          to={getStatusLink("OK", item.periodo, selectedUsuario._id)}
                          className="inline-flex min-w-20 items-center justify-center rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                        >
                          {item.ok}
                        </Link>
                      </td>

                      <td className="px-3 py-3.5 text-center">
                        <Link
                          to={getStatusLink("Pendiente", item.periodo, selectedUsuario._id)}
                          className="inline-flex min-w-20 items-center justify-center rounded-full bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
                        >
                          {item.pendiente}
                        </Link>
                      </td>

                      <td className="px-3 py-3.5 text-center">
                        <Link
                          to={getStatusLink("Denegado", item.periodo, selectedUsuario._id)}
                          className="inline-flex min-w-20 items-center justify-center rounded-full bg-rose-50 px-3 py-1.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                        >
                          {item.denegado}
                        </Link>
                      </td>

                      <td className="px-3 py-3.5 text-center">
                        <Link
                          to={getStatusLink("Diferido", item.periodo, selectedUsuario._id)}
                          className="inline-flex min-w-20 items-center justify-center rounded-full bg-fuchsia-50 px-3 py-1.5 text-sm font-semibold text-fuchsia-700 transition hover:bg-fuchsia-100"
                        >
                          {item.diferido}
                        </Link>
                      </td>

                      <td className="px-3 py-3.5 text-center">
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
            <div className="px-4 py-6 text-center">
              <p className="text-sm font-medium text-slate-700">Este usuario no tiene atenciones registradas.</p>
            </div>
          ) : null}
        </section>

        <section className="mt-6 rounded-2xl border border-secondary-dark/60 bg-white shadow-sm">
          <div className="border-b border-secondary-dark/50 px-4 py-3">
            <h3 className="text-lg font-semibold text-slate-900">Cuenta corriente</h3>
            <p className="text-sm text-slate-500">Pagos registrados al odontólogo por período contable y fecha efectiva de abono.</p>
          </div>

          {isPagosLoading ? <LoadingSpinner label="Cargando cuenta corriente..." className="min-h-[140px]" /> : null}

          {!isPagosLoading && isPagosError ? (
            <div className="px-4 py-3">
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                Ocurrió un error al cargar la cuenta corriente del odontólogo.
              </div>
            </div>
          ) : null}

          {!isPagosLoading && !isPagosError && (pagosUsuario?.data?.length ?? 0) > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="border-b border-secondary-dark/50 bg-secondary/40">
                  <tr>
                    <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-dark/80">Fecha pago</th>
                    <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-dark/80">Período</th>
                    <th className="px-3 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-dark/80">$ Atención</th>
                    <th className="px-3 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-dark/80">$ Coseguro</th>
                    <th className="px-3 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-dark/80">$ Total</th>
                    <th className="px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-dark/80">Atenciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-dark/40">
                  {pagosUsuario?.data.map((pago) => (
                    <tr key={pago._id} className="transition-colors hover:bg-secondary/20">
                      <td className="whitespace-nowrap px-3 py-3.5 text-sm text-slate-800">{pago.fechaPago}</td>
                      <td className="whitespace-nowrap px-3 py-3.5 text-sm text-slate-800">{pago.periodoPago}</td>
                      <td className="whitespace-nowrap px-3 py-3.5 text-right text-sm text-slate-800">{formatCurrency(pago.totalAtencion)}</td>
                      <td className="whitespace-nowrap px-3 py-3.5 text-right text-sm text-slate-800">{formatCurrency(pago.totalCoseguroOdonto)}</td>
                      <td className="whitespace-nowrap px-3 py-3.5 text-right text-sm font-semibold text-primary-dark">{formatCurrency(pago.totalGeneral)}</td>
                      <td className="px-3 py-3.5 text-center text-sm font-semibold text-slate-800">{pago.items.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {!isPagosLoading && !isPagosError && (pagosUsuario?.data?.length ?? 0) === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-sm font-medium text-slate-700">Este odontólogo no tiene pagos registrados.</p>
            </div>
          ) : null}
        </section>
        </>
      ) : null}
    </>
  );
}
