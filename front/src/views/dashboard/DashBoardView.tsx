import { getResumenAtenciones } from "@/api/atencioneAPI";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, CalendarDays } from "lucide-react";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function DashBoardView() {
  const {
    data: resumen,
    isError,
    isLoading,
  } = useQuery({
    queryKey: ["atenciones", "resumen"],
    queryFn: getResumenAtenciones,
  });

  if (isLoading) {
    return <LoadingSpinner label="Cargando resumen de atenciones..." />;
  }

  if (isError || !resumen) {
    return (
      <>
        <div className="mb-6 flex flex-col gap-4 border-b border-secondary-dark/60 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Dashboard</p>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Resumen de mis atenciones</h2>
          </div>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          Ocurrió un error al cargar el resumen de atenciones.
        </div>
      </>
    );
  }

  const dataPorDia = resumen.atencionesPorDiaMesActual.map((item) => ({
    ...item,
    label: String(item.dia),
  }));

  const dataPorMes = resumen.atencionesPorMes.map((item) => ({
    ...item,
    label: new Date(item.anio, item.mes - 1, 1).toLocaleDateString("es-AR", {
      month: "short",
      year: "2-digit",
    }),
  }));

  const resumenMensual = resumen.resumenMensual.map((item) => ({
    ...item,
    mesLabel: new Date(item.anio, item.mes - 1, 1).toLocaleDateString("es-AR", {
      month: "long",
    }),
  }));

  const totalMesActual = resumen.atencionesPorDiaMesActual.reduce((total, item) => total + item.cantidad, 0);
  const totalHistorico = resumen.atencionesPorMes.reduce((total, item) => total + item.cantidad, 0);
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    }).format(value);

  const renderStatusCell = (
    periodo: string,
    status: "OK" | "Pendiente" | "Denegado" | "Diferido" | "No cargado",
    value: number,
    className: string,
  ) => {
    if (value > 0) {
      return (
        <Link
          to={`/atenciones/filtrar?periodo=${periodo}&status=${status}`}
          className={`inline-flex min-w-12 items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold transition hover:brightness-95 ${className}`}
        >
          {value}
        </Link>
      );
    }

    return <span className={`inline-flex min-w-12 items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>{value}</span>;
  };

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 border-b border-secondary-dark/60 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Dashboard</p>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Resumen de mis atenciones</h2>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-6">
        <section className="rounded-2xl border border-secondary-dark/60 bg-white p-6 shadow-sm xl:col-span-4">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <div className="mb-2 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-primary">
                <CalendarDays className="h-5 w-5" strokeWidth={2} />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Atenciones por día</h3>
              <p className="text-sm text-slate-500">Distribución diaria del mes actual.</p>
            </div>

            <div className="rounded-2xl border border-secondary-dark/50 bg-secondary/30 px-4 py-3 text-right">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Mes actual</p>
              <p className="text-2xl font-semibold text-primary-dark">{totalMesActual}</p>
            </div>
          </div>

          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataPorDia} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="dailyBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#15AA9A" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#0E7C72" stopOpacity={0.78} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#D8EEEA" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#64748B", fontSize: 12 }} interval={0} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "#64748B", fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: "rgba(21, 170, 154, 0.08)" }}
                  contentStyle={{
                    borderRadius: 16,
                    border: "1px solid rgba(21, 170, 154, 0.18)",
                    boxShadow: "0 20px 50px -40px rgba(14,124,114,0.6)",
                  }}
                  formatter={(value) => [`${value ?? 0}`, "Atenciones"]}
                  labelFormatter={(label) => `Día ${label}`}
                />
                <Bar dataKey="cantidad" fill="url(#dailyBar)" radius={[10, 10, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-secondary-dark/60 bg-white p-6 shadow-sm xl:col-span-2">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <div className="mb-2 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-primary">
                <BarChart3 className="h-5 w-5" strokeWidth={2} />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Atenciones por mes</h3>
              <p className="text-sm text-slate-500">Totales acumulados por mes.</p>
            </div>

            <div className="rounded-2xl border border-secondary-dark/50 bg-secondary/30 px-4 py-3 text-right">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Histórico</p>
              <p className="text-2xl font-semibold text-primary-dark">{totalHistorico}</p>
            </div>
          </div>

          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataPorMes} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#E6EEF2" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#64748B", fontSize: 12 }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "#64748B", fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: "rgba(14, 124, 114, 0.08)" }}
                  contentStyle={{
                    borderRadius: 16,
                    border: "1px solid rgba(21, 170, 154, 0.18)",
                    boxShadow: "0 20px 50px -40px rgba(14,124,114,0.6)",
                  }}
                  formatter={(value) => [`${value ?? 0}`, "Atenciones"]}
                  labelFormatter={(label) => `Mes ${label}`}
                />
                <Bar dataKey="cantidad" radius={[10, 10, 0, 0]} maxBarSize={36}>
                  {dataPorMes.map((item, index) => (
                    <Cell key={item.periodo} fill={index === dataPorMes.length - 1 ? "#15AA9A" : "#9FD7D1"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-secondary-dark/60 bg-white shadow-sm">
        <div className="border-b border-secondary-dark/50 px-6 py-5">
          <h3 className="text-lg font-semibold text-slate-900">Resumen mensual</h3>
          <p className="text-sm text-slate-500">Montos de atención, coseguro odontológico y cantidad de códigos por estado.</p>
        </div>

        {resumenMensual.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="border-b border-secondary-dark/50 bg-secondary/40">
                <tr>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Mes</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">$ Atención</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">$ Coseguro</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">$ Total</th>
                  <th className="bg-emerald-100/80 px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-emerald-800">OK</th>
                  <th className="bg-amber-100/90 px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-amber-800">Pend</th>
                  <th className="bg-rose-100/90 px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-rose-800">Denegada</th>
                  <th className="bg-fuchsia-100/90 px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-fuchsia-800">Diferida</th>
                  <th className="bg-gray-100 px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-gray-700">No cargado</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-secondary-dark/40">
                {resumenMensual.map((item) => (
                  <tr key={item.periodo} className="transition-colors hover:bg-secondary/20">
                    <td className="whitespace-nowrap px-4 py-3">
                      <p className="text-sm font-semibold capitalize text-slate-800">{item.mesLabel}</p>
                      <p className="text-xs text-slate-500">{item.anio}</p>
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <p className="text-sm font-medium text-slate-800">{formatCurrency(item.montoAtencion)}</p>
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <p className={`text-sm font-medium ${item.montoCoseguro < 0 ? "text-rose-700" : "text-slate-800"}`}>
                        {formatCurrency(item.montoCoseguro)}
                      </p>
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <p className="text-sm font-semibold text-primary-dark">{formatCurrency(item.montoTotal)}</p>
                    </td>

                    <td className="px-4 py-3 text-center">
                      {renderStatusCell(item.periodo, "OK", item.ok, "bg-emerald-50 text-emerald-700")}
                    </td>

                    <td className="px-4 py-3 text-center">
                      {renderStatusCell(item.periodo, "Pendiente", item.pendiente, "bg-amber-50 text-amber-700")}
                    </td>

                    <td className="px-4 py-3 text-center">
                      {renderStatusCell(item.periodo, "Denegado", item.denegado, "bg-rose-50 text-rose-700")}
                    </td>

                    <td className="px-4 py-3 text-center">
                      {renderStatusCell(item.periodo, "Diferido", item.diferido, "bg-fuchsia-50 text-fuchsia-700")}
                    </td>

                    <td className="px-4 py-3 text-center">
                      {renderStatusCell(item.periodo, "No cargado", item.noCargado, "bg-gray-100 text-gray-700")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-10 text-center">
            <p className="text-sm font-medium text-slate-700">No hay información mensual para mostrar.</p>
          </div>
        )}
      </section>
    </>
  );
}
