import { getAtencionByID } from "@/api/atencioneAPI";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CircleDollarSign, Pencil, Shield, UserRound } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

export default function AtencionView() {
  const navigate = useNavigate();
  const params = useParams();
  const idAtencion = params.idAtencion!;

  const {
    data: atencion,
    isError,
    isLoading,
  } = useQuery({
    queryKey: ["atencion", idAtencion],
    queryFn: () => getAtencionByID(idAtencion),
    retry: false,
  });

  if (isLoading) {
    return <LoadingSpinner label="Cargando atencion..." />;
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
        Ocurrió un error al cargar la atencion.
      </div>
    );
  }

  if (!atencion) return null;

  const formatFecha = (fecha: string) =>
    new Intl.DateTimeFormat("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(fecha));

  const formatMoney = (value?: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(value ?? 0);

  const totalCodigos = atencion.codigos.reduce((acc, item) => acc + (item.status === "OK" ? item.valor : 0), 0);
  const totalGeneral = totalCodigos + (atencion.coseguroOdonto ?? 0);
  const totalNoLiquidable = atencion.codigos.reduce((acc, item) => acc + (item.status !== "OK" ? item.valor : 0), 0);

  const statusClasses: Record<string, string> = {
    OK: "bg-green-50 text-green-700 border border-green-200",
    Pendiente: "bg-amber-50 text-amber-700 border border-amber-200",
    Denegado: "bg-red-50 text-red-700 border border-red-200",
    Diferido: "bg-slate-100 text-slate-700 border border-slate-200",
    "No cargado": "bg-gray-100 text-gray-700 border border-gray-200",
  };

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 border-b border-secondary-dark/60 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Atenciones</p>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            Detalle de atencion
            <span className="ml-2 text-lg font-medium text-slate-500">{formatFecha(atencion.fecha)}</span>
          </h2>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to={`/atenciones/${idAtencion}/editar`}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
          >
            <Pencil className="h-4 w-4" strokeWidth={2.2} />
            <span>Editar</span>
          </Link>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-secondary-dark/60 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-primary/40 hover:bg-secondary/40 hover:text-primary-dark"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2.2} />
            <span>Volver</span>
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-secondary-dark/60 bg-white p-3 shadow-sm sm:p-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-xl bg-secondary/20 px-3 py-2.5">
            <div className="flex items-start gap-3">
              <div className="inline-flex rounded-lg bg-secondary/50 p-2 text-primary-dark">
                <UserRound className="h-4 w-4" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Paciente</p>
                <p className="mt-1 truncate text-sm font-semibold uppercase text-slate-900">
                  {atencion.paciente.lastName} {atencion.paciente.name}
                </p>
                <p className="mt-0.5 text-xs text-slate-600">DNI {atencion.paciente.dni}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-secondary/20 px-3 py-2.5">
            <div className="flex items-start gap-3">
              <div className="inline-flex rounded-lg bg-secondary/50 p-2 text-primary-dark">
                <Shield className="h-4 w-4" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Obra social</p>
                <p className="mt-1 truncate text-sm font-semibold uppercase text-slate-900">{atencion.obraSocial.name}</p>
                <p className="mt-0.5 text-xs text-slate-600">{atencion.codigos.length} codigos cargados</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-secondary/20 px-3 py-2.5">
            <div className="flex items-start gap-3">
              <div className="inline-flex rounded-lg bg-secondary/50 p-2 text-primary-dark">
                <CircleDollarSign className="h-4 w-4" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Total liquidable</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{formatMoney(totalGeneral)}</p>
                <p className="mt-0.5 text-xs text-slate-600">Incluye códigos OK y coseguro odonto</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Monto pendiente o no liquidable: <span className="font-semibold">{formatMoney(totalNoLiquidable)}</span>
      </div>

      <div className="mt-6 space-y-6">
        <div className="rounded-2xl border border-secondary-dark/60 bg-white shadow-sm">
          <div className="border-b border-secondary-dark/40 px-4 py-4 sm:px-5">
            <h3 className="text-base font-semibold text-slate-900">Codigos de la atencion</h3>
            <p className="mt-1 text-sm text-slate-600">Detalle de prestaciones, piezas, estado y observaciones.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="border-b border-secondary-dark/50 bg-secondary/40">
                <tr>
                  <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-primary-dark/80 sm:px-4">Codigo</th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-primary-dark/80 sm:px-4">Descripcion</th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-primary-dark/80 sm:px-4">Pieza</th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-primary-dark/80 sm:px-4">Valor</th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-primary-dark/80 sm:px-4">Estado</th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-primary-dark/80 sm:px-4">Observaciones</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-secondary-dark/40">
                {atencion.codigos.map((item, index) => (
                  <tr key={`${item.codigo._id}-${index}`} className="transition-colors hover:bg-secondary/20">
                    <td className="whitespace-nowrap px-3 py-2.5 sm:px-4">
                      <p className="text-xs font-medium text-slate-800 sm:text-sm">{item.codigo.code}</p>
                    </td>

                    <td className="px-3 py-2.5 sm:px-4">
                      <p className="text-xs text-slate-700 sm:text-sm">{item.codigo.description.trim()}</p>
                    </td>

                    <td className="px-3 py-2.5 sm:px-4">
                      <p className="text-xs text-slate-700 sm:text-sm">{item.pieza}</p>
                    </td>

                    <td className="whitespace-nowrap px-3 py-2.5 sm:px-4">
                      <p className="text-xs text-slate-700 sm:text-sm">{formatMoney(item.valor)}</p>
                    </td>

                    <td className="px-3 py-2.5 sm:px-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          statusClasses[item.status] ?? "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>

                    <td className="px-3 py-2.5 sm:px-4">
                      <p className="text-xs leading-5 text-slate-600 sm:text-sm">{item.observaciones || "Sin observaciones"}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-secondary-dark/60 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">Observacion de la atencion</h3>
          <p className="mt-3 text-sm leading-6 text-slate-700">{atencion.observaciones || "Sin observaciones."}</p>
        </div>
      </div>
    </>
  );
}
