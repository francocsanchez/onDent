import { getPacientes } from "@/api/pacienteAPI";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useQuery } from "@tanstack/react-query";
import { Pencil, Plus } from "lucide-react";
import { Link } from "react-router-dom";

export default function ListPacientesView() {
  const {
    data: pacientes,
    isError,
    isLoading,
  } = useQuery({
    queryKey: ["pacientes", "listar"],
    queryFn: getPacientes,
  });

  if (isLoading) {
    return <LoadingSpinner label="Cargando pacientes..." />;
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
        Ocurrió un error al cargar los pacientes.
      </div>
    );
  }

  if (pacientes)
    return (
      <>
        <div className="mb-6 flex flex-col gap-4 border-b border-secondary-dark/60 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Pacientes</p>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Listado de pacientes</h2>
          </div>

          <Link
            to="/pacientes/create"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white  transition-colors hover:bg-primary-dark"
          >
            <Plus className="h-4 w-4" strokeWidth={2.2} />
            <span>Nuevo paciente</span>
          </Link>
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="rounded-2xl border border-secondary-dark/60 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-secondary/40 border-b border-secondary-dark/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Apellido</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Nombre</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Obra Social</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">DNI</th>
                    <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Acciones</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-secondary-dark/40">
                  {pacientes.map((paciente) => (
                    <tr key={paciente._id} className="transition-colors hover:bg-secondary/20">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-slate-800 uppercase">{paciente.lastName}</p>
                      </td>

                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-slate-800 uppercase">{paciente.name}</p>
                      </td>

                      <td className="px-4 py-3">
                        <p className="text-sm text-slate-600 uppercase">{paciente.obraSocial.name}</p>
                      </td>

                      <td className="px-4 py-3">
                        <p className="text-sm text-slate-600">{paciente.dni}</p>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Link
                            to={`${paciente._id}/atender`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-secondary/40 px-2.5 py-1.5 text-xs font-medium text-primary-dark transition-colors hover:bg-secondary/60"
                          >
                            <span>Atender</span>
                          </Link>

                          <Link
                            to={`${paciente._id}/editar`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-secondary-dark/60 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-primary/40 hover:bg-secondary/40 hover:text-primary-dark"
                          >
                            <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                            <span>Editar</span>
                          </Link>
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
}
