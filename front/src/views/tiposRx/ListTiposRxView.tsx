import { changeStatusTipoRx, getTiposRx } from "@/api/tipoRxAPI";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, ShieldCheck, ShieldOff } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export default function ListTiposRxView() {
  const queryClient = useQueryClient();
  const { data: tiposRx, isLoading, isError } = useQuery({
    queryKey: ["tipos_rx", "listar"],
    queryFn: getTiposRx,
  });

  const { mutate: changeStatus } = useMutation({
    mutationFn: changeStatusTipoRx,
    onError: (error: Error) => toast.error(error.message),
    onSuccess: (response: { message?: string }) => {
      toast.success(response.message || "Estado actualizado");
      queryClient.invalidateQueries({ queryKey: ["tipos_rx", "listar"] });
    },
  });

  if (isLoading) return <LoadingSpinner label="Cargando tipos de RX..." />;
  if (isError || !tiposRx) return <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">Ocurrió un error al cargar los tipos de RX.</div>;

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 border-b border-secondary-dark/60 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Tipos de RX</p>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Listado de tipos de RX</h2>
        </div>

        <Link to="/config/tipos-rx/create" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark">
          <Plus className="h-4 w-4" strokeWidth={2.2} />
          <span>Nuevo tipo RX</span>
        </Link>
      </div>

      <div className="rounded-2xl border border-secondary-dark/60 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="border-b border-secondary-dark/50 bg-secondary/40">
              <tr>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Nombre</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-dark/40">
              {tiposRx.map((tipoRx) => (
                <tr key={tipoRx._id} className="transition-colors hover:bg-secondary/20">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium uppercase text-slate-800">{tipoRx.name}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Link to={`${tipoRx._id}/editar`} className="inline-flex items-center gap-1.5 rounded-lg border border-secondary-dark/60 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-primary/40 hover:bg-secondary/40 hover:text-primary-dark">
                        <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                        <span>Editar</span>
                      </Link>
                      <button type="button" onClick={() => changeStatus(tipoRx._id)} className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${!tipoRx.enable ? "border border-green-200 bg-green-50 text-green-600 hover:bg-green-100" : "border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"}`}>
                        {tipoRx.enable ? <ShieldOff className="h-3.5 w-3.5" strokeWidth={2} /> : <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} />}
                        <span>{tipoRx.enable ? "Deshabilitar" : "Habilitar"}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
