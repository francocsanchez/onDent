import { getAtencionesByUsuario } from "@/api/atencioneAPI";
import { getUsuarioByID } from "@/api/usuarioAPI";
import LoadingSpinner from "@/components/LoadingSpinner";
import { formatDateOnly } from "@/utils/date";
import { useQuery } from "@tanstack/react-query";
import { FileSearch, Filter } from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router-dom";

const validStatuses = ["OK", "Pendiente", "Denegado", "Diferido", "No cargado"] as const;
type AtencionStatus = (typeof validStatuses)[number];

const statusClasses: Record<AtencionStatus, string> = {
  OK: "bg-green-50 text-green-700 border border-green-200",
  Pendiente: "bg-amber-50 text-amber-700 border border-amber-200",
  Denegado: "bg-red-50 text-red-700 border border-red-200",
  Diferido: "bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200",
  "No cargado": "bg-gray-100 text-gray-700 border border-gray-200",
};

export default function ReportesAtencionesByEstadoView() {
  const { estado: rawEstado, idUsuario } = useParams();
  const [searchParams] = useSearchParams();
  const periodo = searchParams.get("periodo")?.trim() ?? "";
  const estado = validStatuses.includes(rawEstado as AtencionStatus) ? (rawEstado as AtencionStatus) : null;

  const {
    data: usuario,
    isLoading: isUsuarioLoading,
    isError: isUsuarioError,
  } = useQuery({
    queryKey: ["usuarios", "detalle", idUsuario],
    queryFn: () => getUsuarioByID(idUsuario!),
    enabled: !!idUsuario,
  });

  const {
    data: atenciones,
    isLoading: isAtencionesLoading,
    isError: isAtencionesError,
  } = useQuery({
    queryKey: ["reportes", "atenciones", "usuario", idUsuario],
    queryFn: () => getAtencionesByUsuario(idUsuario!),
    enabled: !!idUsuario && !!estado,
  });

  const getPeriodLabel = (periodoValue: string) => {
    if (!/^\d{4}-\d{2}$/.test(periodoValue)) return "Todos los períodos";
    const [anio, mes] = periodoValue.split("-").map(Number);
    return new Date(anio, mes - 1, 1).toLocaleDateString("es-AR", {
      month: "long",
      year: "numeric",
    });
  };

  if (!idUsuario || !estado) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
        Los parámetros del reporte no son válidos.
      </div>
    );
  }

  if (isUsuarioLoading || isAtencionesLoading) {
    return <LoadingSpinner label="Cargando reporte de atenciones..." />;
  }

  if (isUsuarioError || isAtencionesError || !usuario || !atenciones) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
        Ocurrió un error al cargar el reporte de atenciones.
      </div>
    );
  }

  const atencionesFiltradas = atenciones.filter((atencion) => {
    const matchStatus = atencion.codigos.some((codigo) => codigo.status === estado);
    if (!matchStatus) return false;

    if (/^\d{4}-\d{2}$/.test(periodo)) {
      const fechaAtencion = atencion.fecha.slice(0, 7);
      return fechaAtencion === periodo;
    }

    return true;
  });

  const periodLabel = getPeriodLabel(periodo);

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 border-b border-secondary-dark/60 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Reportes</p>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Atenciones por estado</h2>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-secondary-dark/60 bg-secondary/30 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-primary-dark">
              <Filter className="h-3.5 w-3.5" strokeWidth={2} />
              {periodLabel}
            </span>
            <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${statusClasses[estado]}`}>{estado}</span>
          </div>
          <p className="mt-3 text-sm text-slate-500">
            Usuario: {usuario.lastName} {usuario.name}
          </p>
        </div>

        <Link
          to="/reports"
          className="inline-flex items-center justify-center rounded-2xl border border-secondary-dark/60 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-primary/40 hover:bg-secondary/40 hover:text-primary-dark"
        >
          Volver a reportes
        </Link>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="rounded-2xl border border-secondary-dark/60 bg-white shadow-sm">
          {atencionesFiltradas.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="border-b border-secondary-dark/50 bg-secondary/40">
                  <tr>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Fecha</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Paciente</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Obra social</th>
                    <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">
                      Códigos {estado}
                    </th>
                    <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Acciones</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-secondary-dark/40">
                  {atencionesFiltradas.map((atencion) => {
                    const codigosPorEstado = atencion.codigos.filter((codigo) => codigo.status === estado).length;

                    return (
                      <tr key={atencion._id} className="transition-colors hover:bg-secondary/20">
                        <td className="whitespace-nowrap px-4 py-3">
                          <p className="text-sm font-medium text-slate-800">{formatDateOnly(atencion.fecha)}</p>
                        </td>

                        <td className="px-4 py-3">
                          <p className="text-sm font-medium uppercase text-slate-800">
                            {atencion.paciente.lastName} {atencion.paciente.name}
                          </p>
                        </td>

                        <td className="px-4 py-3">
                          <p className="text-sm uppercase text-slate-600">{atencion.obraSocial.name}</p>
                        </td>

                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex min-w-12 items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses[estado]}`}
                          >
                            {codigosPorEstado}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Link
                              to={`/reports/atenciones/${encodeURIComponent(estado)}/${idUsuario}/${atencion._id}/auditar?periodo=${encodeURIComponent(periodo)}`}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-secondary-dark/60 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-primary/40 hover:bg-secondary/40 hover:text-primary-dark"
                            >
                              <FileSearch className="h-3.5 w-3.5" strokeWidth={2} />
                              <span>Auditar</span>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-4 py-10 text-center">
              <p className="text-sm font-medium text-slate-700">
                No hay atenciones con estado {estado} para {usuario.lastName} {usuario.name} en {periodLabel}.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
