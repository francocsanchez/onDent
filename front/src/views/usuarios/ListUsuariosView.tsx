import { changeStatusUsuario, getUsuarios } from "@/api/usuarioAPI";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, ShieldCheck, ShieldOff } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export default function ListUsuariosView() {
  const queryClient = useQueryClient();

  const {
    data: usuarios,
    isError,
    isLoading,
  } = useQuery({
    queryKey: ["usuarios", "listar"],
    queryFn: getUsuarios,
  });

  const { mutate: changeStatus } = useMutation({
    mutationFn: (id: string) => changeStatusUsuario(id),
    onError: (error: any) => {
      toast.error(error.message || "Error al cambiar el estado del usuario");
    },
    onSuccess: (response: any) => {
      toast.success(response.message || "Estado del usuario actualizado");
      queryClient.invalidateQueries({ queryKey: ["usuarios", "listar"] });
    },
  });

  if (isLoading) {
    return <LoadingSpinner label="Cargando usuarios..." />;
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
        Ocurrió un error al cargar los usuarios.
      </div>
    );
  }

  if (usuarios)
    return (
      <>
        <div className="mb-6 flex flex-col gap-4 border-b border-secondary-dark/60 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Usuarios</p>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Listado de usuarios</h2>
          </div>

          <Link
            to="/config/usuarios/create"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white  transition-colors hover:bg-primary-dark"
          >
            <Plus className="h-4 w-4" strokeWidth={2.2} />
            <span>Nuevo usuario</span>
          </Link>
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="rounded-2xl border border-secondary-dark/60 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="border-b border-secondary-dark/50 bg-secondary/40">
                  <tr>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">LastName</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Name</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Email</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Role</th>
                    <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Acciones</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-secondary-dark/40">
                  {usuarios.map((usuario) => (
                    <tr key={usuario._id} className="transition-colors hover:bg-secondary/20">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium capitalize text-slate-800">{usuario.lastName}</p>
                      </td>

                      <td className="px-4 py-3">
                        <p className="text-sm font-medium capitalize text-slate-800">{usuario.name}</p>
                      </td>

                      <td className="px-4 py-3">
                        <p className="text-sm text-slate-700">{usuario.email}</p>
                      </td>

                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold capitalize text-primary-dark">
                          {usuario.role}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Link
                            to={`${usuario._id}/editar`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-secondary-dark/60 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-primary/40 hover:bg-secondary/40 hover:text-primary-dark"
                          >
                            <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                            <span>Editar</span>
                          </Link>

                          <button
                            type="button"
                            onClick={() => changeStatus(usuario._id)}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                              !usuario.enable
                                ? "border border-green-200 bg-green-50 text-green-600 hover:bg-green-100"
                                : "border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                            }`}
                          >
                            {usuario.enable ? (
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
