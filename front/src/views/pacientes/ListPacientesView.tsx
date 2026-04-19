import { getPacienteByDNI } from "@/api/atencioneAPI";
import { getPacientes } from "@/api/pacienteAPI";
import LoadingSpinner from "@/components/LoadingSpinner";
import type { Paciente } from "@/types/index";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Pencil, Plus, Search } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

export default function ListPacientesView() {
  const [page, setPage] = useState(1);
  const [patientSearchDni, setPatientSearchDni] = useState("");
  const [searchedPatient, setSearchedPatient] = useState<Paciente | null>(null);
  const [searchStatus, setSearchStatus] = useState<"idle" | "found" | "not-found">("idle");

  const {
    data: pacientesResponse,
    isError,
    isLoading,
  } = useQuery({
    queryKey: ["pacientes", "listar", page],
    queryFn: () => getPacientes(page),
  });

  const searchPatientMutation = useMutation({
    mutationFn: getPacienteByDNI,
    onSuccess: (patient) => {
      setSearchedPatient(patient);
      setSearchStatus("found");
    },
    onError: () => {
      setSearchedPatient(null);
      setSearchStatus("not-found");
    },
  });

  const performPatientSearch = () => {
    const normalizedDni = patientSearchDni.trim();

    if (!normalizedDni) {
      setSearchedPatient(null);
      setSearchStatus("idle");
      return;
    }

    if (!/^\d+$/.test(normalizedDni) || normalizedDni.length < 7) {
      setSearchedPatient(null);
      setSearchStatus("idle");
      return;
    }

    setSearchStatus("idle");
    searchPatientMutation.mutate(normalizedDni);
  };

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

  const pacientes = pacientesResponse?.data ?? [];
  const pagination = pacientesResponse?.pagination;
  const pacientesToRender = searchedPatient ? [searchedPatient] : pacientes;

  if (pacientesResponse)
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

        <section className="mb-6 overflow-hidden rounded-[1.35rem] border border-secondary-dark/60 bg-white shadow-sm">
          <div className="border-b border-secondary-dark/50 bg-gradient-to-r from-secondary/50 via-white to-white px-5 py-4">
            <h3 className="text-base font-semibold text-slate-900">Busqueda de paciente</h3>
            <p className="mt-0.5 text-sm text-slate-500">Ingresá el DNI para encontrar un paciente puntual dentro del listado.</p>
          </div>

          <div className="grid gap-4 px-5 py-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="space-y-2">
              <label htmlFor="patientSearchDni" className="text-sm font-medium text-slate-700">
                DNI del paciente
              </label>
              <input
                id="patientSearchDni"
                type="text"
                inputMode="numeric"
                placeholder="Ej: 31245780"
                value={patientSearchDni}
                onChange={(event) => {
                  const value = event.target.value.replace(/\D/g, "");
                  setPatientSearchDni(value);

                  if (!value.trim()) {
                    setSearchedPatient(null);
                    setSearchStatus("idle");
                  } else if (searchedPatient || searchStatus !== "idle") {
                    setSearchedPatient(null);
                    setSearchStatus("idle");
                  }
                }}
                className="w-full rounded-xl border border-secondary-dark/60 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <button
              type="button"
              onClick={performPatientSearch}
              disabled={searchPatientMutation.isPending}
              className="inline-flex h-[46px] w-[46px] items-center justify-center rounded-xl bg-primary text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-slate-300"
              aria-label="Buscar paciente"
              title="Buscar paciente"
            >
              <Search className={`h-4 w-4 ${searchPatientMutation.isPending ? "animate-pulse" : ""}`} />
            </button>
          </div>

          {searchStatus === "found" && searchedPatient ? (
            <div className="border-t border-emerald-100 bg-emerald-50/70 px-5 py-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-emerald-700">Paciente encontrado</p>
                  <p className="text-sm text-emerald-600">La tabla muestra el resultado encontrado para ese DNI.</p>
                </div>
                <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                  1 resultado
                </span>
              </div>
            </div>
          ) : null}

          {searchStatus === "not-found" ? (
            <div className="border-t border-rose-100 bg-rose-50/70 px-5 py-4">
              <p className="text-sm font-semibold text-rose-700">Paciente inexistente</p>
              <p className="text-sm text-rose-600">No encontramos un paciente con ese DNI.</p>
            </div>
          ) : null}
        </section>

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
                  {pacientesToRender.map((paciente) => (
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
                            to={`/atenciones/create?pacienteId=${paciente._id}`}
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

            {!searchedPatient && pagination ? (
              <div className="flex flex-col gap-3 border-t border-secondary-dark/40 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">
                  Pagina {pagination.page} de {pagination.totalPages || 1}
                </p>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((currentPage) => Math.max(currentPage - 1, 1))}
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
                    onClick={() => setPage((currentPage) => currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                    className="inline-flex items-center justify-center rounded-lg border border-secondary-dark/60 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-primary/40 hover:bg-secondary/40 hover:text-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </>
    );
}
