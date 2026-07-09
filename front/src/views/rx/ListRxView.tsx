import { getRx } from "@/api/rxAPI";
import LoadingSpinner from "@/components/LoadingSpinner";
import type { Rx } from "@/types/index";
import { formatDateOnly } from "@/utils/date";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

const getDerivanteLabel = (rx: Rx) =>
  rx.derivanteTipo === "interno" && rx.derivanteUsuario ? `${rx.derivanteUsuario.lastName}, ${rx.derivanteUsuario.name}` : (rx.derivanteExterno ?? "-");

export default function ListRxView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedPage = Math.max(Number(searchParams.get("page")?.trim() ?? "1") || 1, 1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["rx", "listar", selectedPage],
    queryFn: () => getRx(selectedPage),
  });

  if (isLoading) return <LoadingSpinner label="Cargando RX..." />;
  if (isError || !data) return <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">Ocurrió un error al cargar las RX.</div>;

  const updatePage = (nextPage: number) => {
    const nextParams = new URLSearchParams(searchParams);
    if (nextPage <= 1) nextParams.delete("page");
    else nextParams.set("page", String(nextPage));
    setSearchParams(nextParams);
  };

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 border-b border-secondary-dark/60 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Radiografías</p>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Últimas RX registradas</h2>
        </div>

        <Link to="/rx/create" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark">
          <Plus className="h-4 w-4" strokeWidth={2.2} />
          <span>Nueva RX</span>
        </Link>
      </div>

      <div className="rounded-2xl border border-secondary-dark/60 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="border-b border-secondary-dark/50 bg-secondary/40">
              <tr>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Fecha</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Paciente</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Tipo RX</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Derivante</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Valor</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Cargó</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-dark/40">
              {data.data.map((rx) => (
                <tr key={rx._id} className="transition-colors hover:bg-secondary/20">
                  <td className="px-4 py-3 text-sm text-slate-700">{formatDateOnly(rx.fecha)}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-slate-800">{rx.paciente.lastName} {rx.paciente.name}</p>
                    <p className="text-xs text-slate-500">DNI {rx.paciente.dni}</p>
                  </td>
                  <td className="px-4 py-3 text-sm uppercase text-slate-700">{rx.tipoRx.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{getDerivanteLabel(rx)}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">${rx.valor.toLocaleString("es-AR")}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{rx.usuarioCarga.lastName}, {rx.usuarioCarga.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 rounded-2xl border border-secondary-dark/40 bg-white px-3 py-2.5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">Página {data.pagination.page} de {data.pagination.totalPages || 1}</p>
        <div className="flex items-center justify-end gap-2">
          <button type="button" onClick={() => updatePage(selectedPage - 1)} disabled={!data.pagination.hasPrevPage} className="inline-flex items-center justify-center rounded-lg border border-secondary-dark/60 bg-white px-2.5 py-1 text-sm font-medium text-slate-600 transition hover:border-primary/40 hover:bg-secondary/40 hover:text-primary-dark disabled:cursor-not-allowed disabled:opacity-50">Anterior</button>
          <span className="inline-flex min-w-[38px] items-center justify-center rounded-lg bg-secondary/40 px-2.5 py-1 text-sm font-semibold text-primary-dark">{data.pagination.page}</span>
          <button type="button" onClick={() => updatePage(selectedPage + 1)} disabled={!data.pagination.hasNextPage} className="inline-flex items-center justify-center rounded-lg border border-secondary-dark/60 bg-white px-2.5 py-1 text-sm font-medium text-slate-600 transition hover:border-primary/40 hover:bg-secondary/40 hover:text-primary-dark disabled:cursor-not-allowed disabled:opacity-50">Siguiente</button>
        </div>
      </div>
    </>
  );
}
