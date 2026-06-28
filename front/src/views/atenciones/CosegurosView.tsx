import { getCoseguros, updateCoseguroOdonto } from "@/api/atencioneAPI";
import LoadingSpinner from "@/components/LoadingSpinner";
import { formatDateOnly } from "@/utils/date";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

type DraftRowState = {
  porcentaje: string;
};

const inputClassName =
  "w-full rounded-xl border border-secondary-dark/60 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20";

const getRowKey = (atencionId: string) => atencionId;

export default function CosegurosView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [rowDrafts, setRowDrafts] = useState<Record<string, DraftRowState>>({});
  const [savingRows, setSavingRows] = useState<Record<string, boolean>>({});

  const selectedPage = useMemo(() => {
    const rawPage = Number(searchParams.get("page")?.trim() ?? "1");
    return Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  }, [searchParams]);

  const {
    data: cosegurosResponse,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["coseguros", "listar", selectedPage],
    queryFn: () => getCoseguros({ page: selectedPage }),
  });

  const mutation = useMutation({
    mutationFn: updateCoseguroOdonto,
  });

  const coseguros = cosegurosResponse?.data ?? [];
  const pagination = cosegurosResponse?.pagination;

  useEffect(() => {
    setRowDrafts((currentDrafts) => {
      const nextDrafts = { ...currentDrafts };

      coseguros.forEach((item) => {
        const rowKey = getRowKey(item.atencionId);
        if (!savingRows[rowKey] && !nextDrafts[rowKey]) {
          nextDrafts[rowKey] = {
            porcentaje: "",
          };
        }
      });

      return nextDrafts;
    });
  }, [coseguros, savingRows]);

  const updatePage = (nextPage: number) => {
    const nextParams = new URLSearchParams(searchParams);

    if (nextPage <= 1) {
      nextParams.delete("page");
    } else {
      nextParams.set("page", String(nextPage));
    }

    setSearchParams(nextParams);
  };

  const updateRowDraft = (rowKey: string, porcentaje: string) => {
    setRowDrafts((currentDrafts) => ({
      ...currentDrafts,
      [rowKey]: {
        porcentaje,
      },
    }));
  };

  const formatMoney = (value?: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 2,
    }).format(value ?? 0);

  const calculateCoseguroOdonto = (coseguro: number, porcentaje: string) => {
    const parsedPorcentaje = Number(porcentaje);
    if (!Number.isFinite(parsedPorcentaje) || parsedPorcentaje < 0) {
      return null;
    }

    return Number(((coseguro * parsedPorcentaje) / 100).toFixed(2));
  };

  const persistRowChanges = async (atencionId: string) => {
    const item = coseguros.find((entry) => entry.atencionId === atencionId);
    const draft = rowDrafts[atencionId];

    if (!item || !draft) return;

    const porcentaje = Number(draft.porcentaje);
    if (!Number.isFinite(porcentaje) || porcentaje < 0) {
      toast.error("El % coseguro debe ser numérico y no negativo");
      return;
    }

    const coseguroOdonto = calculateCoseguroOdonto(item.coseguro, draft.porcentaje);
    if (coseguroOdonto === null) {
      toast.error("No se pudo calcular el coseguro odontológico");
      return;
    }

    setSavingRows((currentRows) => ({ ...currentRows, [atencionId]: true }));

    try {
      const response = await mutation.mutateAsync({
        idAtencion: atencionId,
        coseguroOdonto,
      });

      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["coseguros"] });
      queryClient.invalidateQueries({ queryKey: ["atencion", atencionId] });
      queryClient.invalidateQueries({ queryKey: ["atenciones", "listar"] });
      queryClient.invalidateQueries({ queryKey: ["atenciones", "filtrar"] });
      queryClient.invalidateQueries({ queryKey: ["reportes"] });
      queryClient.invalidateQueries({ queryKey: ["atenciones", "resumen"] });

      setRowDrafts((currentDrafts) => {
        const nextDrafts = { ...currentDrafts };
        delete nextDrafts[atencionId];
        return nextDrafts;
      });
      void response;
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo actualizar el coseguro odontológico";
      toast.error(message);
    } finally {
      setSavingRows((currentRows) => {
        const nextRows = { ...currentRows };
        delete nextRows[atencionId];
        return nextRows;
      });
    }
  };

  if (isLoading) {
    return <LoadingSpinner label="Cargando coseguros..." />;
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
        Ocurrió un error al cargar la vista de coseguros.
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 border-b border-secondary-dark/60 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Coseguros</p>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Coseguros pendientes</h2>
          <p className="mt-1 text-sm text-slate-500">Completá el porcentaje por atención para calcular y guardar el coseguro odontológico.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-secondary-dark/60 bg-white shadow-sm">
        {coseguros.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="border-b border-secondary-dark/50 bg-secondary/40">
                  <tr>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">DNI</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Nombre y apellido paciente</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Coseguro</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">% coseguro</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Coseguro odonto</th>
                    <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Acciones</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-secondary-dark/40">
                  {coseguros.map((item) => {
                    const rowKey = getRowKey(item.atencionId);
                    const rowDraft = rowDrafts[rowKey] ?? { porcentaje: "" };
                    const isSaving = !!savingRows[rowKey];
                    const coseguroOdontoCalculado = calculateCoseguroOdonto(item.coseguro, rowDraft.porcentaje);

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
                        </td>

                        <td className="whitespace-nowrap px-4 py-3">
                          <p className="text-sm text-slate-700">{formatMoney(item.coseguro)}</p>
                        </td>

                        <td className="min-w-[160px] px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            inputMode="decimal"
                            placeholder="Ej: 25"
                            value={rowDraft.porcentaje}
                            disabled={isSaving}
                            onChange={(event) => updateRowDraft(rowKey, event.target.value)}
                            className={`${inputClassName} ${isSaving ? "cursor-wait bg-slate-100 text-slate-500" : ""}`}
                          />
                        </td>

                        <td className="whitespace-nowrap px-4 py-3">
                          <p className="text-sm font-semibold text-slate-900">{formatMoney(coseguroOdontoCalculado ?? 0)}</p>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Link
                              to={`/atenciones/${item.atencionId}`}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-secondary-dark/60 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-primary/40 hover:bg-secondary/40 hover:text-primary-dark"
                            >
                              <Eye className="h-3.5 w-3.5" strokeWidth={2} />
                              <span>Ver atención</span>
                            </Link>

                            <button
                              type="button"
                              disabled={isSaving || coseguroOdontoCalculado === null}
                              onClick={() => void persistRowChanges(item.atencionId)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Save className="h-3.5 w-3.5" strokeWidth={2} />
                              <span>{isSaving ? "Guardando..." : "Guardar"}</span>
                            </button>
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
            <p className="text-sm font-medium text-slate-700">No hay atenciones pendientes de coseguro odontológico.</p>
          </div>
        )}
      </div>
    </>
  );
}
