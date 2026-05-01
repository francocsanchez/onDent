import { getAtencionesFiltradas } from "@/api/atencioneAPI";
import LoadingSpinner from "@/components/LoadingSpinner";
import { formatDateOnly } from "@/utils/date";
import { useQuery } from "@tanstack/react-query";
import { Eye, Filter, Plus } from "lucide-react";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

const validStatuses = ["OK", "Pendiente", "Denegado", "Diferido", "No cargado"] as const;
type AtencionStatus = (typeof validStatuses)[number];

const statusClasses: Record<AtencionStatus, string> = {
  OK: "bg-green-50 text-green-700 border border-green-200",
  Pendiente: "bg-amber-50 text-amber-700 border border-amber-200",
  Denegado: "bg-red-50 text-red-700 border border-red-200",
  Diferido: "bg-slate-100 text-slate-700 border border-slate-200",
  "No cargado": "bg-gray-100 text-gray-700 border border-gray-200",
};

export default function ListAtencionesFilteredView() {
  const [page, setPage] = useState(1);
  const [searchParams] = useSearchParams();
  const periodo = searchParams.get("periodo")?.trim() ?? "";
  const rawStatus = searchParams.get("status")?.trim() ?? "";
  const status = validStatuses.includes(rawStatus as AtencionStatus) ? (rawStatus as AtencionStatus) : null;

  const {
    data: atencionesResponse,
    isError,
    isLoading,
  } = useQuery({
    queryKey: ["atenciones", "filtrar", periodo, status, page],
    queryFn: () => getAtencionesFiltradas({ periodo, status: status!, page }),
    enabled: /^\d{4}-\d{2}$/.test(periodo) && !!status,
  });

  const getPeriodLabel = (periodoValue: string) => {
    if (!/^\d{4}-\d{2}$/.test(periodoValue)) return periodoValue;
    const [anio, mes] = periodoValue.split("-").map(Number);
    return new Date(anio, mes - 1, 1).toLocaleDateString("es-AR", {
      month: "long",
      year: "numeric",
    });
  };

  if (!/^\d{4}-\d{2}$/.test(periodo) || !status) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
        Los filtros de período o estado no son válidos.
      </div>
    );
  }

  if (isLoading) {
    return <LoadingSpinner label="Cargando atenciones filtradas..." />;
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
        Ocurrió un error al cargar las atenciones filtradas.
      </div>
    );
  }

  const atenciones = atencionesResponse?.data ?? [];
  const pagination = atencionesResponse?.pagination;
  const periodLabel = getPeriodLabel(periodo);

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 border-b border-secondary-dark/60 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Atenciones</p>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Listado filtrado por estado</h2>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-secondary-dark/60 bg-secondary/30 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-primary-dark">
              <Filter className="h-3.5 w-3.5" strokeWidth={2} />
              {periodLabel}
            </span>
            <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${statusClasses[status]}`}>{status}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-2xl border border-secondary-dark/60 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-primary/40 hover:bg-secondary/40 hover:text-primary-dark"
          >
            Volver al dashboard
          </Link>
          <Link
            to="/atenciones/create"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
          >
            <Plus className="h-4 w-4" strokeWidth={2.2} />
            <span>Nueva atencion</span>
          </Link>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="rounded-2xl border border-secondary-dark/60 bg-white shadow-sm">
          {atenciones.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="border-b border-secondary-dark/50 bg-secondary/40">
                    <tr>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Usuario</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Fecha</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Paciente</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Obra social</th>
                      <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">
                        Códigos {status}
                      </th>
                      <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Acciones</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-secondary-dark/40">
                    {atenciones.map((atencion) => {
                      const codigosPorEstado = atencion.codigos.filter((codigo) => codigo.status === status).length;

                      return (
                        <tr key={atencion._id} className="transition-colors hover:bg-secondary/20">
                          <td className="whitespace-nowrap px-4 py-3">
                            <p className="text-sm font-medium text-slate-800">
                              {atencion.usuario.lastName}, {atencion.usuario.name}
                            </p>
                          </td>

                          <td className="whitespace-nowrap px-4 py-3">
                            <p className="text-sm font-medium text-slate-800">{formatDateOnly(atencion.fecha)}</p>
                          </td>

                          <td className="px-4 py-3">
                            <p className="text-sm font-medium uppercase text-slate-800">
                              {atencion.paciente.lastName} {atencion.paciente.name}
                            </p>
                          </td>

                          <td className="px-4 py-3">
                            <p className="text-sm uppercase text-slate-600">{atencion.obraSocial.name}</p>
                          </td>

                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-flex min-w-12 items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses[status]}`}
                            >
                              {codigosPorEstado}
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-2">
                              <Link
                                to={`/atenciones/${atencion._id}`}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-secondary-dark/60 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-primary/40 hover:bg-secondary/40 hover:text-primary-dark"
                              >
                                <Eye className="h-3.5 w-3.5" strokeWidth={2} />
                                <span>Ver</span>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {pagination ? (
                <div className="flex flex-col gap-3 border-t border-secondary-dark/40 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-500">
                    Pagina {pagination.page} de {pagination.totalPages || 1}
                  </p>

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setPage((currentPage) => Math.max(currentPage - 1, 1))}
                      disabled={!pagination.hasPrevPage}
                      className="inline-flex items-center justify-center rounded-lg border border-secondary-dark/60 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-primary/40 hover:bg-secondary/40 hover:text-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Anterior
                    </button>

                    <span className="inline-flex min-w-[42px] items-center justify-center rounded-lg bg-secondary/40 px-3 py-2 text-sm font-semibold text-primary-dark">
                      {pagination.page}
                    </span>

                    <button
                      type="button"
                      onClick={() => setPage((currentPage) => currentPage + 1)}
                      disabled={!pagination.hasNextPage}
                      className="inline-flex items-center justify-center rounded-lg border border-secondary-dark/60 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-primary/40 hover:bg-secondary/40 hover:text-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <div className="px-4 py-10 text-center">
              <p className="text-sm font-medium text-slate-700">
                No hay atenciones con estado {status} en {periodLabel}.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
