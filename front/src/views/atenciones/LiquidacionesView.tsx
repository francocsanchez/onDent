import { getLiquidaciones, getLiquidacionesAvailableFilters, updateLiquidacionItem } from "@/api/atencioneAPI";
import LoadingSpinner from "@/components/LoadingSpinner";
import { formatDateOnly } from "@/utils/date";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
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

const statusOptions = [
  { value: "", label: "Todos los estados" },
  { value: "OK", label: "OK" },
  { value: "Pendiente", label: "Pendiente" },
  { value: "Denegado", label: "Denegado" },
  { value: "Diferido", label: "Diferido" },
  { value: "No cargado", label: "No cargado" },
] as const;

const editableStatusOptions = statusOptions.filter((item) => item.value !== "");
const validStatuses = ["OK", "Pendiente", "Denegado", "Diferido", "No cargado"] as const;
type AtencionStatus = (typeof validStatuses)[number];

type EditableRowState = {
  status: AtencionStatus;
  valor: string;
};

const mongoIdRegex = /^[a-f\d]{24}$/i;
const selectClassName =
  "w-full rounded-xl border border-secondary-dark/60 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";
const inputClassName =
  "w-full rounded-xl border border-secondary-dark/60 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20";

const getRowKey = (atencionId: string, codigoId: string) => `${atencionId}:${codigoId}`;

export default function LiquidacionesView() {
  const currentYear = String(new Date().getFullYear());
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [rowDrafts, setRowDrafts] = useState<Record<string, EditableRowState>>({});
  const [savingRows, setSavingRows] = useState<Record<string, boolean>>({});

  const selectedUsuario = useMemo(() => {
    const rawUsuario = searchParams.get("usuario")?.trim() ?? "";
    return mongoIdRegex.test(rawUsuario) ? rawUsuario : "";
  }, [searchParams]);

  const selectedObraSocial = useMemo(() => {
    const rawObraSocial = searchParams.get("obraSocial")?.trim() ?? "";
    return mongoIdRegex.test(rawObraSocial) ? rawObraSocial : "";
  }, [searchParams]);

  const selectedStatus = useMemo(() => {
    const rawStatus = searchParams.get("status")?.trim() ?? "";
    return validStatuses.includes(rawStatus as AtencionStatus) ? (rawStatus as AtencionStatus) : "";
  }, [searchParams]);

  const selectedMonth = useMemo(() => {
    const rawMonth = searchParams.get("month")?.trim() ?? "";
    return monthOptions.some((month) => month.value === rawMonth) ? rawMonth : "";
  }, [searchParams]);

  const selectedYear = useMemo(() => {
    const rawYear = searchParams.get("year")?.trim() ?? "";
    return /^\d{4}$/.test(rawYear) ? rawYear : currentYear;
  }, [currentYear, searchParams]);

  const selectedPage = useMemo(() => {
    const rawPage = Number(searchParams.get("page")?.trim() ?? "1");
    return Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  }, [searchParams]);

  const {
    data: filtersData,
    isLoading: isFiltersLoading,
    isError: isFiltersError,
  } = useQuery({
    queryKey: ["liquidaciones", "filtros"],
    queryFn: getLiquidacionesAvailableFilters,
  });

  const {
    data: liquidacionesResponse,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["liquidaciones", "listar", selectedPage, selectedUsuario, selectedObraSocial, selectedStatus, selectedMonth, selectedYear],
    queryFn: () =>
      getLiquidaciones({
        page: selectedPage,
        usuario: selectedUsuario || undefined,
        obraSocial: selectedObraSocial || undefined,
        status: selectedStatus || undefined,
        month: selectedMonth || undefined,
        year: selectedYear || undefined,
      }),
  });

  const mutation = useMutation({
    mutationFn: updateLiquidacionItem,
  });

  const liquidaciones = liquidacionesResponse?.data ?? [];
  const pagination = liquidacionesResponse?.pagination;

  useEffect(() => {
    setRowDrafts((currentDrafts) => {
      const nextDrafts = { ...currentDrafts };

      liquidaciones.forEach((item) => {
        const rowKey = getRowKey(item.atencionId, item.codigoId);
        if (!savingRows[rowKey]) {
          nextDrafts[rowKey] = {
            status: item.status,
            valor: String(item.valor ?? 0),
          };
        }
      });

      return nextDrafts;
    });
  }, [liquidaciones, savingRows]);

  const availableYears = Array.from(
    new Set([currentYear, ...(filtersData?.availableYears.map(String) ?? [])]),
  ).sort((firstYear, secondYear) => Number(secondYear) - Number(firstYear));

  const updateFilter = (key: "usuario" | "obraSocial" | "status" | "month" | "year", value: string) => {
    const nextParams = new URLSearchParams(searchParams);

    if (value) {
      nextParams.set(key, value);
    } else {
      nextParams.delete(key);
    }

    if (key === "year" && !value) {
      nextParams.set("year", currentYear);
    }

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

  const updateRowDraft = (rowKey: string, partial: Partial<EditableRowState>) => {
    setRowDrafts((currentDrafts) => ({
      ...currentDrafts,
      [rowKey]: {
        ...(currentDrafts[rowKey] ?? { status: "Pendiente", valor: "0" }),
        ...partial,
      },
    }));
  };

  const persistRowChanges = async (rowKey: string) => {
    const item = liquidaciones.find((entry) => getRowKey(entry.atencionId, entry.codigoId) === rowKey);
    const draft = rowDrafts[rowKey];

    if (!item || !draft) return;

    const parsedValor = Number(draft.valor);
    if (!Number.isFinite(parsedValor) || parsedValor < 0) {
      toast.error("El valor debe ser numérico y no negativo");
      setRowDrafts((currentDrafts) => ({
        ...currentDrafts,
        [rowKey]: {
          status: item.status,
          valor: String(item.valor ?? 0),
        },
      }));
      return;
    }

    if (item.status === draft.status && Number(item.valor ?? 0) === parsedValor) {
      return;
    }

    setSavingRows((currentRows) => ({ ...currentRows, [rowKey]: true }));

    try {
      const response = await mutation.mutateAsync({
        idAtencion: item.atencionId,
        codigoId: item.codigoId,
        status: draft.status,
        valor: parsedValor,
      });

      setRowDrafts((currentDrafts) => ({
        ...currentDrafts,
        [rowKey]: {
          status: response.data.status,
          valor: String(response.data.valor),
        },
      }));

      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["liquidaciones"] });
      queryClient.invalidateQueries({ queryKey: ["atenciones", "listar"] });
      queryClient.invalidateQueries({ queryKey: ["atenciones", "filtrar"] });
      queryClient.invalidateQueries({ queryKey: ["atencion", item.atencionId] });
      queryClient.invalidateQueries({ queryKey: ["reportes"] });
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo actualizar la liquidación";
      setRowDrafts((currentDrafts) => ({
        ...currentDrafts,
        [rowKey]: {
          status: item.status,
          valor: String(item.valor ?? 0),
        },
      }));
      toast.error(message);
    } finally {
      setSavingRows((currentRows) => {
        const nextRows = { ...currentRows };
        delete nextRows[rowKey];
        return nextRows;
      });
    }
  };

  if (isLoading || isFiltersLoading) {
    return <LoadingSpinner label="Cargando liquidaciones..." />;
  }

  if (isError || isFiltersError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
        Ocurrió un error al cargar la vista de liquidaciones.
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 border-b border-secondary-dark/60 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Liquidaciones</p>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Liquidaciones masivas</h2>
          <p className="mt-1 text-sm text-slate-500">Auditá y actualizá estado y valor por código sin entrar atención por atención.</p>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-secondary-dark/60 bg-white p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Usuario</span>
            <select value={selectedUsuario} onChange={(event) => updateFilter("usuario", event.target.value)} className={selectClassName}>
              <option value="">Todos los usuarios</option>
              {(filtersData?.usuarios ?? []).map((usuario) => (
                <option key={usuario._id} value={usuario._id}>
                  {usuario.lastName}, {usuario.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Obra social</span>
            <select value={selectedObraSocial} onChange={(event) => updateFilter("obraSocial", event.target.value)} className={selectClassName}>
              <option value="">Todas las obras sociales</option>
              {(filtersData?.obrasSociales ?? []).map((obraSocial) => (
                <option key={obraSocial._id} value={obraSocial._id}>
                  {obraSocial.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Estado</span>
            <select value={selectedStatus} onChange={(event) => updateFilter("status", event.target.value)} className={selectClassName}>
              {statusOptions.map((status) => (
                <option key={status.label} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mes</span>
            <select value={selectedMonth} onChange={(event) => updateFilter("month", event.target.value)} className={selectClassName}>
              {monthOptions.map((month) => (
                <option key={month.label} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Año</span>
            <select value={selectedYear} onChange={(event) => updateFilter("year", event.target.value)} className={selectClassName}>
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-secondary-dark/60 bg-white shadow-sm">
        {liquidaciones.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="border-b border-secondary-dark/50 bg-secondary/40">
                  <tr>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">DNI paciente</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Nombre y apellido paciente</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Obra social</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Código de atención</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Estado</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Valor</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-secondary-dark/40">
                  {liquidaciones.map((item) => {
                    const rowKey = getRowKey(item.atencionId, item.codigoId);
                    const rowDraft = rowDrafts[rowKey] ?? {
                      status: item.status,
                      valor: String(item.valor ?? 0),
                    };
                    const isSaving = !!savingRows[rowKey];

                    return (
                      <tr key={rowKey} className={`transition-colors hover:bg-secondary/20 ${isSaving ? "bg-secondary/10" : ""}`}>
                        <td className="whitespace-nowrap px-4 py-3">
                          <p className="text-sm font-medium text-slate-800">{item.paciente.dni}</p>
                          <p className="mt-0.5 text-xs text-slate-500">{formatDateOnly(item.fecha)}</p>
                        </td>

                        <td className="px-4 py-3">
                          <p className="text-sm font-medium uppercase text-slate-800">
                            {item.paciente.lastName} {item.paciente.name}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {item.usuario.lastName}, {item.usuario.name}
                          </p>
                        </td>

                        <td className="px-4 py-3">
                          <p className="text-sm text-slate-700">{item.obraSocial.name}</p>
                        </td>

                        <td className="px-4 py-3">
                          <p className="text-sm font-semibold text-slate-900">{item.codigoAtencion.code}</p>
                          <p className="mt-0.5 text-xs text-slate-500">{item.codigoAtencion.description}</p>
                        </td>

                        <td className="min-w-[190px] px-4 py-3">
                          <select
                            value={rowDraft.status}
                            disabled={isSaving}
                            onChange={(event) => updateRowDraft(rowKey, { status: event.target.value as AtencionStatus })}
                            onBlur={() => void persistRowChanges(rowKey)}
                            className={`${selectClassName} ${isSaving ? "cursor-wait bg-slate-100 text-slate-500" : ""}`}
                          >
                            {editableStatusOptions.map((status) => (
                              <option key={status.value} value={status.value}>
                                {status.label}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="min-w-[160px] px-4 py-3">
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              inputMode="decimal"
                              value={rowDraft.valor}
                              disabled={isSaving}
                              onChange={(event) => updateRowDraft(rowKey, { valor: event.target.value })}
                              onBlur={() => void persistRowChanges(rowKey)}
                              className={`${inputClassName} pr-10 ${isSaving ? "cursor-wait bg-slate-100 text-slate-500" : ""}`}
                            />
                            {isSaving ? (
                              <span className="pointer-events-none absolute inset-y-0 right-3 inline-flex items-center text-slate-400">
                                <RefreshCw className="h-4 w-4 animate-spin" strokeWidth={2} />
                              </span>
                            ) : null}
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
                  Página {pagination.page} de {pagination.totalPages || 1}
                </p>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => updatePage(selectedPage - 1)}
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
                    onClick={() => updatePage(selectedPage + 1)}
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
            <p className="text-sm font-medium text-slate-700">No hay liquidaciones para los filtros seleccionados.</p>
          </div>
        )}
      </div>
    </>
  );
}
