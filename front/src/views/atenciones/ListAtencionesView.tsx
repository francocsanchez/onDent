import { getAtenciones, getAtencionesAvailableFilters, getAtencionesForExport } from "@/api/atencioneAPI";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useQuery } from "@tanstack/react-query";
import { exportAtencionesToExcel } from "@/utils/atencionesExcel";
import { Download, Eye, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const monthOptions = [
  { value: "", label: "Todos los meses" },
  { value: "01", label: "Enero" },
  { value: "02", label: "Febrero" },
  { value: "03", label: "Marzo" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Mayo" },
  { value: "06", label: "Junio" },
  { value: "07", label: "Julio" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
] as const;

export default function ListAtencionesView() {
  const currentDate = new Date();
  const currentYear = String(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [page, setPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);

  const {
    data: filtersData,
    isError: isFiltersError,
  } = useQuery({
    queryKey: ["atenciones", "filtros"],
    queryFn: getAtencionesAvailableFilters,
  });

  const {
    data: atencionesResponse,
    isError,
    isLoading,
  } = useQuery({
    queryKey: ["atenciones", "listar", page, selectedYear, selectedMonth],
    queryFn: () =>
      getAtenciones({
        page,
        year: selectedYear || undefined,
        month: selectedMonth || undefined,
      }),
  });

  useEffect(() => {
    setPage(1);
  }, [selectedMonth, selectedYear]);

  if (isLoading) {
    return <LoadingSpinner label="Cargando atenciones..." />;
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
        Ocurrió un error al cargar las atenciones.
      </div>
    );
  }

  const formatFecha = (fecha: string) =>
    new Intl.DateTimeFormat("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(fecha));

  const atenciones = atencionesResponse?.data ?? [];
  const pagination = atencionesResponse?.pagination;
  const availableYears = Array.from(
    new Set([currentYear, ...(filtersData?.availableYears.map(String) ?? [])]),
  ).sort((firstYear, secondYear) => Number(secondYear) - Number(firstYear));

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const atencionesToExport = await getAtencionesForExport({
        year: selectedYear || undefined,
        month: selectedMonth || undefined,
      });

      if (!atencionesToExport.length) {
        toast.error("No hay atenciones para exportar con el filtro seleccionado");
        return;
      }

      await exportAtencionesToExcel(atencionesToExport, {
        year: selectedYear || undefined,
        month: selectedMonth || undefined,
      });
      toast.success("Excel generado correctamente");
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo generar el Excel";
      toast.error(message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 border-b border-secondary-dark/60 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Atenciones</p>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Listado de atenciones</h2>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <label className="flex min-w-[180px] flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mes</span>
            <select
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              className="rounded-2xl border border-secondary-dark/60 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-primary/40"
            >
              {monthOptions.map((month) => (
                <option key={month.value || "all-months"} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex min-w-[140px] flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Año</span>
            <select
              value={selectedYear}
              onChange={(event) => setSelectedYear(event.target.value)}
              className="rounded-2xl border border-secondary-dark/60 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-primary/40"
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-secondary-dark/60 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-primary/40 hover:bg-secondary/40 hover:text-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" strokeWidth={2.2} />
            <span>{isExporting ? "Generando..." : "Descargar Excel"}</span>
          </button>

          <Link
            to="/atenciones/create"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
          >
            <Plus className="h-4 w-4" strokeWidth={2.2} />
            <span>Nueva atencion</span>
          </Link>
        </div>
      </div>

      {isFiltersError ? (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
          No se pudieron cargar todos los años disponibles. Se muestran opciones locales.
        </div>
      ) : null}

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
                      <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Nombre paciente</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Obra social</th>
                      <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">
                        Cantidad de codigos
                      </th>
                      <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Acciones</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-secondary-dark/40">
                    {atenciones.map((atencion) => (
                      <tr key={atencion._id} className="transition-colors hover:bg-secondary/20">
                        <td className="whitespace-nowrap px-4 py-3">
                          <p className="text-sm font-medium text-slate-800">
                            {atencion.usuario.lastName}, {atencion.usuario.name}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <p className="text-sm font-medium text-slate-800">{formatFecha(atencion.fecha)}</p>
                        </td>

                        <td className="px-4 py-3">
                          <p className="text-sm font-medium uppercase text-slate-800">
                            {atencion.paciente.lastName} {atencion.paciente.name}
                          </p>
                        </td>

                        <td className="px-4 py-3">
                          <p className="text-sm text-slate-600 uppercase">{atencion.obraSocial.name}</p>
                        </td>

                        <td className="px-4 py-3">
                          <p className="text-center text-sm text-slate-600">{atencion.codigos.length}</p>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Link
                              to={`${atencion._id}`}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-secondary-dark/60 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-primary/40 hover:bg-secondary/40 hover:text-primary-dark"
                            >
                              <Eye className="h-3.5 w-3.5" strokeWidth={2} />
                              <span>Ver</span>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
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
              <p className="text-sm font-medium text-slate-700">No hay atenciones registradas.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
