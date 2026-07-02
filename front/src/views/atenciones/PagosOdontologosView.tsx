import { createPagoOdontologo, getPagosAvailableFilters, getPagosByUsuario, getPagosPendientes } from "@/api/atencioneAPI";
import LoadingSpinner from "@/components/LoadingSpinner";
import { formatDateOnly } from "@/utils/date";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, RefreshCw, Save } from "lucide-react";
import { useMemo, useState } from "react";
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

const estadoFuenteOptions = [
  { value: "OK+Pendiente", label: "OK + Pendiente" },
  { value: "OK", label: "Solo OK" },
  { value: "Pendiente", label: "Solo Pendiente" },
  { value: "todos-visibles", label: "Todos visibles" },
] as const;

const selectClassName =
  "w-full rounded-xl border border-secondary-dark/60 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";
const inputClassName =
  "w-full rounded-xl border border-secondary-dark/60 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20";

export default function PagosOdontologosView() {
  const currentYear = String(new Date().getFullYear());
  const currentPeriod = `${currentYear}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});
  const [periodoPago, setPeriodoPago] = useState(currentPeriod);

  const selectedUsuario = searchParams.get("usuario")?.trim() ?? "";
  const selectedMonth = searchParams.get("month")?.trim() ?? "";
  const selectedYear = searchParams.get("year")?.trim() ?? currentYear;
  const selectedEstadoFuente = (searchParams.get("estadoFuente")?.trim() ?? "OK+Pendiente") as
    | "OK"
    | "Pendiente"
    | "OK+Pendiente"
    | "todos-visibles";
  const selectedPage = Number(searchParams.get("page")?.trim() ?? "1") || 1;

  const {
    data: filtersData,
    isLoading: isLoadingFilters,
    isError: isFiltersError,
  } = useQuery({
    queryKey: ["pagos", "filtros"],
    queryFn: getPagosAvailableFilters,
  });

  const {
    data: pendientesResponse,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["pagos", "pendientes", selectedUsuario, selectedMonth, selectedYear, selectedEstadoFuente, selectedPage],
    queryFn: () =>
      getPagosPendientes({
        page: selectedPage,
        usuario: selectedUsuario,
        month: selectedMonth || undefined,
        year: selectedYear || undefined,
        estadoFuente: selectedEstadoFuente,
      }),
    enabled: !!selectedUsuario,
  });

  const { data: cuentaCorriente } = useQuery({
    queryKey: ["pagos", "cuenta-corriente", selectedUsuario],
    queryFn: () => getPagosByUsuario(selectedUsuario),
    enabled: !!selectedUsuario,
  });

  const mutation = useMutation({
    mutationFn: createPagoOdontologo,
    onSuccess: (response) => {
      toast.success(response.message);
      setSelectedRows({});
      queryClient.invalidateQueries({ queryKey: ["pagos"] });
      queryClient.invalidateQueries({ queryKey: ["atenciones"] });
      queryClient.invalidateQueries({ queryKey: ["reportes"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const pendientes = pendientesResponse?.data ?? [];
  const pagination = pendientesResponse?.pagination;
  const availableYears = Array.from(new Set([currentYear, ...(filtersData?.availableYears.map(String) ?? [])])).sort(
    (firstYear, secondYear) => Number(secondYear) - Number(firstYear),
  );

  const updateFilter = (key: "usuario" | "month" | "year" | "estadoFuente", value: string) => {
    const nextParams = new URLSearchParams(searchParams);

    if (value) nextParams.set(key, value);
    else nextParams.delete(key);

    if (key === "year" && !value) {
      nextParams.set("year", currentYear);
    }

    nextParams.delete("page");
    setSearchParams(nextParams);
    setSelectedRows({});
  };

  const selectedAtenciones = useMemo(
    () => pendientes.filter((item) => selectedRows[item.atencionId] && item.selectable),
    [pendientes, selectedRows],
  );
  const selectedTotal = selectedAtenciones.reduce((total, item) => total + item.montoTotalPagable, 0);

  const formatMoney = (value?: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 2,
    }).format(value ?? 0);

  const handleToggleRow = (atencionId: string) => {
    setSelectedRows((current) => ({
      ...current,
      [atencionId]: !current[atencionId],
    }));
  };

  const handleSelectAll = () => {
    const selectableRows = pendientes.filter((item) => item.selectable);
    const allSelected = selectableRows.every((item) => selectedRows[item.atencionId]);

    if (allSelected) {
      setSelectedRows({});
      return;
    }

    setSelectedRows(
      selectableRows.reduce<Record<string, boolean>>((acc, item) => {
        acc[item.atencionId] = true;
        return acc;
      }, {}),
    );
  };

  const handleSave = async () => {
    if (!selectedUsuario) {
      toast.error("Seleccioná un odontólogo");
      return;
    }

    if (!selectedAtenciones.length) {
      toast.error("Seleccioná al menos una atención");
      return;
    }

    await mutation.mutateAsync({
      usuario: selectedUsuario,
      periodoPago,
      items: selectedAtenciones.map((item) => ({ atencionId: item.atencionId })),
    });
  };

  if (isLoadingFilters) {
    return <LoadingSpinner label="Cargando pagos..." />;
  }

  if (isFiltersError) {
    return <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">No se pudieron cargar los filtros.</div>;
  }

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 border-b border-secondary-dark/60 pb-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Pagos</p>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Pagos a odontólogos</h2>
          <p className="mt-1 text-sm text-slate-500">Se liquidan solo códigos OK no pagados. Los ya abonados quedan fuera de futuros cierres.</p>
        </div>

        <div className="flex flex-col gap-2 sm:items-end">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Período de pago</label>
          <input value={periodoPago} onChange={(event) => setPeriodoPago(event.target.value)} type="month" className={inputClassName} />
        </div>
      </div>

      <div className="mb-4 rounded-2xl border border-secondary-dark/60 bg-white p-3 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Odontólogo</span>
            <select value={selectedUsuario} onChange={(event) => updateFilter("usuario", event.target.value)} className={selectClassName}>
              <option value="">Seleccionar odontólogo</option>
              {(filtersData?.usuarios ?? []).map((usuario) => (
                <option key={usuario._id} value={usuario._id}>
                  {usuario.lastName}, {usuario.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mes atención</span>
            <select value={selectedMonth} onChange={(event) => updateFilter("month", event.target.value)} className={selectClassName}>
              {monthOptions.map((month) => (
                <option key={month.value || "all"} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Año atención</span>
            <select value={selectedYear} onChange={(event) => updateFilter("year", event.target.value)} className={selectClassName}>
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Visibilidad</span>
            <select value={selectedEstadoFuente} onChange={(event) => updateFilter("estadoFuente", event.target.value)} className={selectClassName}>
              {estadoFuenteOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {!selectedUsuario ? (
        <div className="rounded-2xl border border-secondary-dark/60 bg-white px-4 py-10 text-center shadow-sm">
          <p className="text-sm font-medium text-slate-700">Seleccioná un odontólogo para cargar pagos pendientes.</p>
        </div>
      ) : isLoading ? (
        <LoadingSpinner label="Cargando pagos pendientes..." />
      ) : isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">No se pudieron cargar los pagos pendientes.</div>
      ) : (
        <div className="space-y-4">
          <section className="rounded-2xl border border-secondary-dark/60 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-secondary-dark/40 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Pendientes de pago</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Seleccionadas {selectedAtenciones.length} atenciones. Total a pagar: <span className="font-semibold text-slate-900">{formatMoney(selectedTotal)}</span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="inline-flex items-center justify-center rounded-xl border border-secondary-dark/60 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-primary/40 hover:bg-secondary/40 hover:text-primary-dark"
                >
                  Seleccionar visibles
                </button>

                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={mutation.isPending || selectedAtenciones.length === 0}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {mutation.isPending ? <RefreshCw className="h-4 w-4 animate-spin" strokeWidth={2.2} /> : <Save className="h-4 w-4" strokeWidth={2.2} />}
                  <span>{mutation.isPending ? "Guardando..." : "Guardar liquidación"}</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="border-b border-secondary-dark/50 bg-secondary/40">
                  <tr>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Sel.</th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Fecha</th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Paciente</th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">$ Atención</th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">$ Coseguro Odonto</th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">$ Total</th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Resumen</th>
                    <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Acción</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-secondary-dark/40">
                  {pendientes.map((item) => (
                    <tr key={item.atencionId} className="transition-colors hover:bg-secondary/20">
                      <td className="px-3 py-2.5">
                        <input type="checkbox" checked={!!selectedRows[item.atencionId]} disabled={!item.selectable} onChange={() => handleToggleRow(item.atencionId)} />
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-sm text-slate-700">{formatDateOnly(item.fecha)}</td>
                      <td className="px-3 py-2.5">
                        <p className="text-sm font-medium uppercase text-slate-900">
                          {item.paciente.lastName} {item.paciente.name}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">DNI {item.paciente.dni}</p>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-sm text-slate-700">{formatMoney(item.montoAtencionPagable)}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-sm text-slate-700">{formatMoney(item.montoCoseguroOdontoPagable)}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-sm font-semibold text-slate-900">{formatMoney(item.montoTotalPagable)}</td>
                      <td className="px-3 py-2.5 text-sm text-slate-600">
                        {item.okPagables} OK nuevos / {item.okPagados} OK ya pagos / {item.pendientes} pendientes
                        {!item.selectable ? <p className="mt-1 text-xs font-medium text-amber-700">Sin saldo pagable</p> : null}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <Link
                          to={`/atenciones/${item.atencionId}`}
                          className="inline-flex items-center gap-2 rounded-xl border border-secondary-dark/60 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-primary/40 hover:bg-secondary/40 hover:text-primary-dark"
                        >
                          <Eye className="h-4 w-4" strokeWidth={2} />
                          <span>Ver</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-2xl border border-secondary-dark/60 bg-white shadow-sm">
            <div className="border-b border-secondary-dark/40 px-3 py-3">
              <h3 className="text-base font-semibold text-slate-900">Cuenta corriente</h3>
              <p className="mt-1 text-sm text-slate-500">Pagos registrados para el odontólogo seleccionado.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="border-b border-secondary-dark/50 bg-secondary/40">
                  <tr>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Fecha pago</th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Período</th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">$ Atención</th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">$ Coseguro Odonto</th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">$ Total</th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Atenciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-dark/40">
                  {(cuentaCorriente?.data ?? []).map((pago) => (
                    <tr key={pago._id} className="transition-colors hover:bg-secondary/20">
                      <td className="whitespace-nowrap px-3 py-2.5 text-sm text-slate-700">{formatDateOnly(pago.fechaPago)}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-sm text-slate-700">{pago.periodoPago}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-sm text-slate-700">{formatMoney(pago.totalAtencion)}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-sm text-slate-700">{formatMoney(pago.totalCoseguroOdonto)}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-sm font-semibold text-slate-900">{formatMoney(pago.totalGeneral)}</td>
                      <td className="px-3 py-2.5 text-sm text-slate-700">{pago.items.length}</td>
                    </tr>
                  ))}
                  {(cuentaCorriente?.data ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                        No hay pagos registrados todavía.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>

          {pagination ? (
            <div className="flex items-center justify-between rounded-2xl border border-secondary-dark/40 bg-white px-3 py-3 shadow-sm">
              <p className="text-sm text-slate-500">
                Página {pagination.page} de {pagination.totalPages || 1}
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={!pagination.hasPrevPage}
                  onClick={() => {
                    const nextParams = new URLSearchParams(searchParams);
                    const nextPage = Math.max(selectedPage - 1, 1);
                    if (nextPage <= 1) nextParams.delete("page");
                    else nextParams.set("page", String(nextPage));
                    setSearchParams(nextParams);
                  }}
                  className="rounded-lg border border-secondary-dark/60 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-primary/40 hover:bg-secondary/40 hover:text-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  disabled={!pagination.hasNextPage}
                  onClick={() => {
                    const nextParams = new URLSearchParams(searchParams);
                    nextParams.set("page", String(selectedPage + 1));
                    setSearchParams(nextParams);
                  }}
                  className="rounded-lg border border-secondary-dark/60 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-primary/40 hover:bg-secondary/40 hover:text-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </>
  );
}
