import { getControlFacturacionPacientes } from "@/api/controlFacturacionAPI";
import LoadingSpinner from "@/components/LoadingSpinner";
import type { ControlFacturacionPacienteResumen } from "@/types/index";
import { controlFacturacionMonthOptions } from "@/utils/controlFacturacion";
import { getCurrentMonthYearLocal } from "@/utils/date";
import { useQuery } from "@tanstack/react-query";
import { Eye, Plus } from "lucide-react";
import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";

const { month: currentMonth, year: currentYear } = getCurrentMonthYearLocal();

const shortMonthLabelFormatter = new Intl.DateTimeFormat("es-AR", {
  month: "short",
  year: "2-digit",
});

const formatPeriodoLabel = (month: number, year: number) =>
  shortMonthLabelFormatter
    .format(new Date(year, month - 1, 1))
    .replace(".", "")
    .toLowerCase();

export default function ListControlFacturacionView() {
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedMonth = useMemo(() => {
    const rawMonth = searchParams.get("month")?.trim() ?? String(currentMonth).padStart(2, "0");
    return controlFacturacionMonthOptions.some((monthOption) => monthOption.value === rawMonth) ? rawMonth : String(currentMonth).padStart(2, "0");
  }, [searchParams]);

  const selectedYear = useMemo(() => {
    const rawYear = searchParams.get("year")?.trim() ?? String(currentYear);
    return /^\d{4}$/.test(rawYear) ? rawYear : String(currentYear);
  }, [searchParams]);

  const selectedPage = useMemo(() => {
    const rawPage = Number(searchParams.get("page")?.trim() ?? "1");
    return Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  }, [searchParams]);

  const {
    data: response,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["control-facturacion", "pacientes", selectedPage, selectedMonth, selectedYear],
    queryFn: () =>
      getControlFacturacionPacientes({
        page: selectedPage,
        month: selectedMonth,
        year: selectedYear,
      }),
  });

  const updateFilter = (key: "month" | "year", value: string) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set(key, value);
    nextParams.delete("page");
    setSearchParams(nextParams);
  };

  const updatePage = (nextPage: number) => {
    const nextParams = new URLSearchParams(searchParams);

    if (nextPage <= 1) {
      nextParams.delete("page");
    } else {
      nextParams.set("page", String(nextPage));
    }

    setSearchParams(nextParams);
  };

  if (isLoading) {
    return <LoadingSpinner label="Cargando pacientes..." />;
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
        Ocurrió un error al cargar los pacientes del control de facturación.
      </div>
    );
  }

  const pacientes = response?.data ?? [];
  const pagination = response?.pagination;

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 border-b border-secondary-dark/60 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Control facturación</p>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Pacientes con cargas</h2>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <label className="flex min-w-[180px] flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mes</span>
            <select
              value={selectedMonth}
              onChange={(event) => updateFilter("month", event.target.value)}
              className="rounded-2xl border border-secondary-dark/60 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-primary/40"
            >
              {controlFacturacionMonthOptions.map((monthOption) => (
                <option key={monthOption.value} value={monthOption.value}>
                  {monthOption.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex min-w-[140px] flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Año</span>
            <input
              type="number"
              min={2000}
              max={9999}
              value={selectedYear}
              onChange={(event) => updateFilter("year", event.target.value)}
              className="rounded-2xl border border-secondary-dark/60 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-primary/40"
            />
          </label>

          <Link
            to="/control-facturacion/create"
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark"
          >
            <Plus className="h-4 w-4" />
            Nueva carga
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-[1.6rem] border border-secondary-dark/60 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-dark/50">
            <thead className="bg-secondary/40">
              <tr>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Paciente</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Obra social</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Último período</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Cargas</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Códigos</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Acción</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-secondary-dark/40 bg-white">
              {pacientes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                    No hay pacientes con cargas para el período seleccionado.
                  </td>
                </tr>
              ) : (
                pacientes.map((patientRow: ControlFacturacionPacienteResumen) => {
                  const patientParams = new URLSearchParams({
                    month: selectedMonth,
                    year: selectedYear,
                  });

                  return (
                    <tr key={patientRow.paciente._id} className="align-top">
                      <td className="px-4 py-4 text-sm text-slate-700">
                        <p className="font-medium text-slate-900">
                          {patientRow.paciente.lastName} {patientRow.paciente.name}
                        </p>
                        <p className="text-xs text-slate-500">DNI {patientRow.paciente.dni}</p>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">{patientRow.obraSocial.name}</td>
                      <td className="px-4 py-4 text-sm text-slate-700">
                        {formatPeriodoLabel(patientRow.ultimoPeriodoMes, patientRow.ultimoPeriodoAnio)}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">{patientRow.totalRegistros}</td>
                      <td className="px-4 py-4 text-sm text-slate-700">{patientRow.totalItems}</td>
                      <td className="px-4 py-4 text-right">
                        <Link
                          to={`/control-facturacion/paciente/${patientRow.paciente._id}?${patientParams.toString()}`}
                          className="inline-flex items-center gap-2 rounded-lg border border-secondary-dark/60 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-primary/40 hover:bg-secondary/40 hover:text-primary-dark"
                        >
                          <Eye className="h-4 w-4" />
                          Ver cargas
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {pagination ? (
          <div className="flex flex-col gap-3 border-t border-secondary-dark/50 px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Página {pagination.page} de {pagination.totalPages} · {pagination.total} pacientes
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => updatePage(pagination.page - 1)}
                disabled={!pagination.hasPrevPage}
                className="rounded-lg border border-secondary-dark/60 px-3 py-1.5 font-medium transition hover:border-primary/40 hover:bg-secondary/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Anterior
              </button>

              <button
                type="button"
                onClick={() => updatePage(pagination.page + 1)}
                disabled={!pagination.hasNextPage}
                className="rounded-lg border border-secondary-dark/60 px-3 py-1.5 font-medium transition hover:border-primary/40 hover:bg-secondary/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
