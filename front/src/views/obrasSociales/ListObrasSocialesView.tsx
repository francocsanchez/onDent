import { changeStatusObraSocial, getObrasSociales } from "@/api/obraSocialAPI";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, ShieldCheck, ShieldOff } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

type MutationResponse = {
  message?: string;
};

export default function ListObrasSocialesView() {
  const queryClient = useQueryClient();

  const {
    data: obrasSociales,
    isError,
    isLoading,
  } = useQuery({
    queryKey: ["obras_sociales", "listar"],
    queryFn: getObrasSociales,
  });

  const { mutate: changeStatus } = useMutation({
    mutationFn: (id: string) => changeStatusObraSocial(id),
    onError: (error: Error) => {
      toast.error(error.message || "Error al cambiar el estado de la obra social");
    },
    onSuccess: (response: MutationResponse | undefined) => {
      toast.success(response?.message || "Estado de la obra social actualizada");
      queryClient.invalidateQueries({ queryKey: ["obras_sociales", "listar"] });
    },
  });

  if (isLoading) {
    return <LoadingSpinner label="Cargando obras sociales..." />;
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
        Ocurrió un error al cargar las obras sociales.
      </div>
    );
  }

  if (obrasSociales)
    return (
      <>
        <div className="mb-6 flex flex-col gap-4 border-b border-secondary-dark/60 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Obras sociales</p>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Listado de obras sociales</h2>
          </div>

          <Link
            to="/config/obras-sociales/create"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white  transition-colors hover:bg-primary-dark"
          >
            <Plus className="h-4 w-4" strokeWidth={2.2} />
            <span>Nueva obra social</span>
          </Link>
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="rounded-2xl border border-secondary-dark/60 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-secondary/40 border-b border-secondary-dark/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Nombre</th>
                    <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Acciones</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-secondary-dark/40">
                  {obrasSociales.map((obraSocial) => (
                    <tr key={obraSocial._id} className="transition-colors hover:bg-secondary/20">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-slate-800 leading-tight uppercase">{obraSocial.name}</p>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Link
                            to={`${obraSocial._id}/editar`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-secondary-dark/60 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-primary/40 hover:bg-secondary/40 hover:text-primary-dark"
                          >
                            <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                            <span>Editar</span>
                          </Link>

                          <button
                            type="button"
                            onClick={() => changeStatus(obraSocial._id)}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                              !obraSocial.enable
                                ? "border border-green-200 bg-green-50 text-green-600 hover:bg-green-100"
                                : "border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                            }`}
                          >
                            {obraSocial.enable ? (
                              <>
                                <ShieldOff className="h-3.5 w-3.5" strokeWidth={2} />
                                <span>Deshabilitar</span>
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} />
                                <span>Habilitar</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </>
    );

  return null;
}
