import { getAtencionesByUsuario } from "@/api/atencioneAPI";
import { getUsuarios } from "@/api/usuarioAPI";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
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

const toDate = (value?: string | Date) => {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export default function ReportesView() {
  const [selectedUsuarioId, setSelectedUsuarioId] = useState<string | null>(null);

  const {
    data: usuarios,
    isError,
    isLoading,
  } = useQuery({
    queryKey: ["usuarios", "listar"],
    queryFn: getUsuarios,
  });

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
      const atencionDate = toDate(atencion.fecha) ?? toDate(atencion.createdAt);
      if (!atencionDate) return;

      const year = atencionDate.getFullYear();
      const month = atencionDate.getMonth();
      const periodo = `${year}-${String(month + 1).padStart(2, "0")}`;

      const resumenActual = resumenMensualMap.get(periodo) ?? {
        periodo,
        anio: year,
        mes: month + 1,
        montoAtencion: 0,
        montoCoseguro: 0,
        montoTotal: 0,
        ok: 0,
        pendiente: 0,
        denegado: 0,
        diferido: 0,
        noCargado: 0,
      };

      resumenActual.montoAtencion += atencion.codigos.reduce((total, codigo) => total + codigo.valor, 0);
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

  if (isLoading) {
    return <LoadingSpinner label="Cargando usuarios para reportes..." />;
  }

  if (isError || !usuarios) {
    return (
      <>
        <div className="mb-6 flex flex-col gap-4 border-b border-secondary-dark/60 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Reportes</p>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Reportes por usuario</h2>
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
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Reportes por usuario</h2>
          <p className="mt-1 text-sm text-slate-500">Seleccioná un usuario para consultar el resumen mensual de sus atenciones.</p>
        </div>

        <div className="inline-flex w-fit items-center gap-2 rounded-2xl border border-secondary-dark/50 bg-secondary/30 px-4 py-3">
          <BadgeCheck className="h-4 w-4 text-primary" strokeWidth={2.2} />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Usuarios</p>
            <p className="text-lg font-semibold text-primary-dark">{usuarios.length}</p>
          </div>
        </div>
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
