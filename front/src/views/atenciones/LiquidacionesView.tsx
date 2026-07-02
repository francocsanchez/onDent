import { getLiquidaciones, getLiquidacionesAvailableFilters, updateLiquidacionesBulk } from "@/api/atencioneAPI";
import LoadingSpinner from "@/components/LoadingSpinner";
import { formatDateOnly } from "@/utils/date";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, RefreshCw, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
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

const pagoOptions = [
  { value: "", label: "Todos" },
  { value: "no-pagado", label: "No pagado" },
  { value: "pagado", label: "Pagado" },
] as const;

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

const getRowKey = (atencionId: string, rowIndex: number) => `${atencionId}:${rowIndex}`;

export default function LiquidacionesView() {
  const currentYear = String(new Date().getFullYear());
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [rowDrafts, setRowDrafts] = useState<Record<string, EditableRowState>>({});

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

  const selectedPagoEstado = useMemo(() => {
    const rawPagoEstado = searchParams.get("pagoEstado")?.trim() ?? "";
    return pagoOptions.some((option) => option.value === rawPagoEstado) ? rawPagoEstado : "";
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
    queryKey: ["liquidaciones", "listar", selectedPage, selectedUsuario, selectedObraSocial, selectedStatus, selectedPagoEstado, selectedMonth, selectedYear],
    queryFn: () =>
      getLiquidaciones({
        page: selectedPage,
        usuario: selectedUsuario || undefined,
        obraSocial: selectedObraSocial || undefined,
        status: selectedStatus || undefined,
        pagoEstado: selectedPagoEstado === "pagado" || selectedPagoEstado === "no-pagado" ? selectedPagoEstado : undefined,
        month: selectedMonth || undefined,
        year: selectedYear || undefined,
      }),
  });

  const bulkMutation = useMutation({
    mutationFn: updateLiquidacionesBulk,
  });

  const liquidaciones = liquidacionesResponse?.data ?? [];
  const pagination = liquidacionesResponse?.pagination;

  useEffect(() => {
    setRowDrafts((currentDrafts) => {
      const nextDrafts = { ...currentDrafts };

      liquidaciones.forEach((atencion) => {
        atencion.codigos.forEach((codigo) => {
          const rowKey = getRowKey(atencion.atencionId, codigo.rowIndex);
          if (!bulkMutation.isPending) {
            nextDrafts[rowKey] = {
              status: codigo.status,
              valor: String(codigo.valor ?? 0),
            };
          }
        });
      });

      return nextDrafts;
    });
  }, [bulkMutation.isPending, liquidaciones]);

  const availableYears = Array.from(new Set([currentYear, ...(filtersData?.availableYears.map(String) ?? [])])).sort(
    (firstYear, secondYear) => Number(secondYear) - Number(firstYear),
  );

  const updateFilter = (key: "usuario" | "obraSocial" | "status" | "pagoEstado" | "month" | "year", value: string) => {
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

  const changedItems = useMemo(() => {
    return liquidaciones.flatMap((atencion) =>
      atencion.codigos.flatMap((codigo) => {
        if (codigo.pagadoOdonto) {
          return [];
        }

        const rowKey = getRowKey(atencion.atencionId, codigo.rowIndex);
        const draft = rowDrafts[rowKey];

        if (!draft) return [];

        const parsedValor = Number(draft.valor);
        if (!Number.isFinite(parsedValor) || parsedValor < 0) return [];

        if (codigo.status === draft.status && Number(codigo.valor ?? 0) === parsedValor) {
          return [];
        }

        return [
          {
            idAtencion: atencion.atencionId,
            codigoId: codigo.codigoId,
            rowIndex: codigo.rowIndex,
            status: draft.status,
            valor: parsedValor,
          },
        ];
      }),
    );
  }, [liquidaciones, rowDrafts]);

  const changedAtencionIds = useMemo(() => Array.from(new Set(changedItems.map((item) => item.idAtencion))), [changedItems]);

  const handleSaveAll = async () => {
    if (!changedItems.length) return;

    const invalidItem = changedItems.find((item) => !Number.isFinite(item.valor) || item.valor < 0);
    if (invalidItem) {
      toast.error("Hay valores inválidos. Revisá los importes antes de guardar.");
      return;
    }

    try {
      const response = await bulkMutation.mutateAsync({
        items: changedItems,
      });

      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["liquidaciones"] });
      queryClient.invalidateQueries({ queryKey: ["atenciones", "listar"] });
      queryClient.invalidateQueries({ queryKey: ["atenciones", "filtrar"] });
      queryClient.invalidateQueries({ queryKey: ["reportes"] });

      changedAtencionIds.forEach((idAtencion) => {
        queryClient.invalidateQueries({ queryKey: ["atencion", idAtencion] });
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudieron actualizar las liquidaciones";
      toast.error(message);
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
          <p className="mt-1 text-sm text-slate-500">Auditá y actualizá por atención, agrupando todos los códigos cargados en un mismo bloque.</p>
        </div>

        <button
          type="button"
          disabled={bulkMutation.isPending || changedItems.length === 0}
          onClick={() => void handleSaveAll()}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {bulkMutation.isPending ? <RefreshCw className="h-4 w-4 animate-spin" strokeWidth={2.2} /> : <Save className="h-4 w-4" strokeWidth={2.2} />}
          <span>{bulkMutation.isPending ? "Guardando..." : `Guardar cambios${changedItems.length ? ` (${changedItems.length})` : ""}`}</span>
        </button>
      </div>

      <div className="mb-6 rounded-2xl border border-secondary-dark/60 bg-white p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
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
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pago</span>
            <select value={selectedPagoEstado} onChange={(event) => updateFilter("pagoEstado", event.target.value)} className={selectClassName}>
              {pagoOptions.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
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

      <div className="space-y-6">
        {liquidaciones.length > 0 ? (
          liquidaciones.map((atencion) => (
            <section key={atencion.atencionId} className="overflow-hidden rounded-2xl border border-secondary-dark/60 bg-white shadow-sm">
              <div className="border-b border-secondary-dark/40 bg-secondary/20 px-4 py-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Paciente</p>
                      <p className="mt-1 text-sm font-semibold uppercase text-slate-900">
                        {atencion.paciente.lastName} {atencion.paciente.name}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-600">DNI {atencion.paciente.dni}</p>
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Obra social</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{atencion.obraSocial.name}</p>
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Profesional</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {atencion.usuario.lastName}, {atencion.usuario.name}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Fecha</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{formatDateOnly(atencion.fecha)}</p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Link
                      to={`/atenciones/${atencion.atencionId}`}
                      className="inline-flex items-center gap-2 rounded-xl border border-secondary-dark/60 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-primary/40 hover:bg-secondary/40 hover:text-primary-dark"
                    >
                      <Eye className="h-4 w-4" strokeWidth={2} />
                      <span>Ver atención</span>
                    </Link>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="border-b border-secondary-dark/40 bg-white">
                    <tr>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Código</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Descripción</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Pieza</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Estado</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Valor</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-secondary-dark/30">
                    {atencion.codigos.map((codigo) => {
                      const rowKey = getRowKey(atencion.atencionId, codigo.rowIndex);
                      const rowDraft = rowDrafts[rowKey] ?? {
                        status: codigo.status,
                        valor: String(codigo.valor ?? 0),
                      };
                      const isPaid = codigo.pagadoOdonto === true;

                      return (
                        <tr key={rowKey} className="transition-colors hover:bg-secondary/20">
                          <td className="px-4 py-3">
                            <p className="text-sm font-semibold text-slate-900">{codigo.codigoAtencion.code}</p>
                          </td>

                          <td className="px-4 py-3">
                            <p className="text-sm text-slate-700">{codigo.codigoAtencion.description}</p>
                          </td>

                          <td className="px-4 py-3">
                            <p className="text-sm text-slate-700">{codigo.pieza || "-"}</p>
                          </td>

                          <td className="min-w-[190px] px-4 py-3">
                            <select
                              value={rowDraft.status}
                              disabled={bulkMutation.isPending || isPaid}
                              onChange={(event) => updateRowDraft(rowKey, { status: event.target.value as AtencionStatus })}
                              className={`${selectClassName} ${bulkMutation.isPending || isPaid ? "cursor-wait bg-slate-100 text-slate-500" : ""}`}
                            >
                              {validStatuses.map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                            </select>
                          </td>

                          <td className="min-w-[160px] px-4 py-3">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              inputMode="decimal"
                              value={rowDraft.valor}
                              disabled={bulkMutation.isPending || isPaid}
                              onChange={(event) => updateRowDraft(rowKey, { valor: event.target.value })}
                              className={`${inputClassName} ${bulkMutation.isPending || isPaid ? "cursor-wait bg-slate-100 text-slate-500" : ""}`}
                            />
                            {isPaid ? <p className="mt-2 text-xs font-medium text-amber-700">Pagado al odontólogo</p> : null}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ))
        ) : (
          <div className="rounded-2xl border border-secondary-dark/60 bg-white px-4 py-10 text-center shadow-sm">
            <p className="text-sm font-medium text-slate-700">No hay liquidaciones para los filtros seleccionados.</p>
          </div>
        )}
      </div>

      {pagination ? (
        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-secondary-dark/40 bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
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
  );
}
