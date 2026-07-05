import { getAtencionesByPaciente } from "@/api/atencioneAPI";
import { getPacienteByID } from "@/api/pacienteAPI";
import LoadingSpinner from "@/components/LoadingSpinner";
import { formatDateOnly } from "@/utils/date";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router-dom";

export default function PacienteAtencionesView() {
  const { idPaciente } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedPage = Math.max(Number(searchParams.get("page")?.trim() ?? "1") || 1, 1);

  const {
    data: paciente,
    isLoading: isPacienteLoading,
    isError: isPacienteError,
  } = useQuery({
    queryKey: ["paciente", "detalle", idPaciente],
    queryFn: () => getPacienteByID(idPaciente!),
    enabled: !!idPaciente,
  });

  const {
    data: atencionesResponse,
    isLoading: isAtencionesLoading,
    isError: isAtencionesError,
  } = useQuery({
    queryKey: ["pacientes", "atenciones", idPaciente, selectedPage],
    queryFn: () => getAtencionesByPaciente(idPaciente!, selectedPage),
    enabled: !!idPaciente,
  });

  if (isPacienteLoading || isAtencionesLoading) {
    return <LoadingSpinner label="Cargando atenciones del paciente..." />;
  }

  if (!idPaciente || isPacienteError || isAtencionesError || !paciente || !atencionesResponse) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
        Ocurrió un error al cargar las atenciones del paciente.
      </div>
    );
  }

  const atenciones = atencionesResponse.data ?? [];
  const pagination = atencionesResponse.pagination;

  const updatePage = (nextPage: number) => {
    const nextParams = new URLSearchParams(searchParams);

    if (nextPage <= 1) {
      nextParams.delete("page");
    } else {
      nextParams.set("page", String(nextPage));
    }

    setSearchParams(nextParams);
  };

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 border-b border-secondary-dark/60 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Pacientes</p>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Atenciones del paciente</h2>
          <p className="mt-1 text-sm text-slate-600">
            {paciente.lastName} {paciente.name} · DNI {paciente.dni}
          </p>
          <p className="text-sm text-slate-500">{paciente.obraSocial.name}</p>
        </div>

        <Link
          to="/pacientes"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-secondary-dark/60 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition-colors hover:border-primary/40 hover:bg-secondary/40 hover:text-primary-dark"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          <span>Volver</span>
        </Link>
      </div>

      <section className="rounded-2xl border border-secondary-dark/60 bg-white shadow-sm">
        {atenciones.length > 0 ? (
          <div className="space-y-2 p-2">
            {atenciones.map((atencion) => (
              <article
                key={`${atencion.paciente._id}-${atencion.fecha}-${atencion.usuario._id}`}
                className="rounded-xl border border-secondary-dark/40 bg-secondary/10 px-2.5 py-2"
              >
                <div className="flex flex-col gap-1 border-b border-secondary-dark/30 pb-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3">
                  <p className="text-sm font-semibold text-slate-900">
                    {atencion.paciente.lastName} {atencion.paciente.name}
                  </p>
                  <p className="text-sm text-slate-600">{formatDateOnly(atencion.fecha)}</p>
                  <p className="text-sm text-slate-600">
                    {atencion.usuario.lastName}, {atencion.usuario.name}
                  </p>
                </div>

                <div className="mt-1.5 rounded-lg bg-white/80 px-2 py-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Códigos</p>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-slate-700">
                    {atencion.codigos.map((codigo, index) => (
                      <span key={`${codigo.codigoId}-${index}`} className="inline-flex flex-wrap items-center gap-x-1">
                        <span className="font-medium text-slate-900">{codigo.code}</span>
                        <span>{codigo.description.trim()}</span>
                        <span className="text-slate-500">-</span>
                        <span>Pieza {codigo.pieza?.trim() ? codigo.pieza : "-"}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="px-3 py-6 text-center text-sm text-slate-500">Este paciente todavía no tiene atenciones registradas.</div>
        )}
      </section>

      {pagination ? (
        <div className="mt-4 flex flex-col gap-2 rounded-2xl border border-secondary-dark/40 bg-white px-3 py-2.5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Página {pagination.page} de {pagination.totalPages || 1}
          </p>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => updatePage(selectedPage - 1)}
              disabled={!pagination.hasPrevPage}
              className="inline-flex items-center justify-center rounded-lg border border-secondary-dark/60 bg-white px-2.5 py-1 text-sm font-medium text-slate-600 transition hover:border-primary/40 hover:bg-secondary/40 hover:text-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              Anterior
            </button>

            <span className="inline-flex min-w-[38px] items-center justify-center rounded-lg bg-secondary/40 px-2.5 py-1 text-sm font-semibold text-primary-dark">
              {pagination.page}
            </span>

            <button
              type="button"
              onClick={() => updatePage(selectedPage + 1)}
              disabled={!pagination.hasNextPage}
              className="inline-flex items-center justify-center rounded-lg border border-secondary-dark/60 bg-white px-2.5 py-1 text-sm font-medium text-slate-600 transition hover:border-primary/40 hover:bg-secondary/40 hover:text-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
