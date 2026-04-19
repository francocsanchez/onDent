import { getAtencionByID } from "@/api/atencioneAPI";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, CircleDollarSign, FileText, Shield, UserRound } from "lucide-react";
import { Link, useParams } from "react-router-dom";

export default function AtencionView() {
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

  const statusClasses: Record<string, string> = {
    OK: "bg-green-50 text-green-700 border border-green-200",
    Pendiente: "bg-amber-50 text-amber-700 border border-amber-200",
    Denegado: "bg-red-50 text-red-700 border border-red-200",
    Diferido: "bg-slate-100 text-slate-700 border border-slate-200",
  };

  const totalCodigos = atencion.codigos.reduce((acc, item) => acc + item.valor, 0);
  const totalGeneral = totalCodigos + (atencion.coseguro ?? 0) + (atencion.coseguroOdonto ?? 0);

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 border-b border-secondary-dark/60 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Atenciones</p>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Detalle de atencion</h2>
        </div>

        <Link
          to="/atenciones"
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-secondary-dark/60 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-primary/40 hover:bg-secondary/40 hover:text-primary-dark"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2.2} />
          <span>Volver</span>
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-secondary-dark/60 bg-white p-4 shadow-sm">
          <div className="mb-3 inline-flex rounded-xl bg-secondary/40 p-2 text-primary-dark">
            <CalendarDays className="h-4 w-4" strokeWidth={2} />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-dark/80">Fecha</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{formatFecha(atencion.fecha)}</p>
        </div>

        <div className="rounded-2xl border border-secondary-dark/60 bg-white p-4 shadow-sm">
          <div className="mb-3 inline-flex rounded-xl bg-secondary/40 p-2 text-primary-dark">
            <UserRound className="h-4 w-4" strokeWidth={2} />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-dark/80">Paciente</p>
          <p className="mt-1 text-lg font-semibold uppercase text-slate-900">
            {atencion.paciente.lastName} {atencion.paciente.name}
          </p>
          <p className="mt-1 text-sm text-slate-600">DNI {atencion.paciente.dni}</p>
        </div>

        <div className="rounded-2xl border border-secondary-dark/60 bg-white p-4 shadow-sm">
          <div className="mb-3 inline-flex rounded-xl bg-secondary/40 p-2 text-primary-dark">
            <Shield className="h-4 w-4" strokeWidth={2} />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-dark/80">Obra social</p>
          <p className="mt-1 text-lg font-semibold uppercase text-slate-900">{atencion.obraSocial.name}</p>
          <p className="mt-1 text-sm text-slate-600">{atencion.codigos.length} codigos cargados</p>
        </div>

        <div className="rounded-2xl border border-secondary-dark/60 bg-white p-4 shadow-sm">
          <div className="mb-3 inline-flex rounded-xl bg-secondary/40 p-2 text-primary-dark">
            <CircleDollarSign className="h-4 w-4" strokeWidth={2} />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-dark/80">Total</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{formatMoney(totalGeneral)}</p>
          <p className="mt-1 text-sm text-slate-600">Incluye codigos y coseguros</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-2xl border border-secondary-dark/60 bg-white shadow-sm">
          <div className="border-b border-secondary-dark/40 px-4 py-4 sm:px-5">
            <h3 className="text-base font-semibold text-slate-900">Codigos de la atencion</h3>
            <p className="mt-1 text-sm text-slate-600">Detalle de prestaciones, piezas, estado y observaciones.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="border-b border-secondary-dark/50 bg-secondary/40">
                <tr>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Codigo</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Descripcion</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Pieza</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Valor</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Estado</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Observaciones</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-secondary-dark/40">
                {atencion.codigos.map((item, index) => (
                  <tr key={`${item.codigo._id}-${index}`} className="transition-colors hover:bg-secondary/20">
                    <td className="whitespace-nowrap px-4 py-3">
                      <p className="text-sm font-medium text-slate-800">{item.codigo.code}</p>
                    </td>

                    <td className="px-4 py-3">
                      <p className="text-sm text-slate-700">{item.codigo.description.trim()}</p>
                    </td>

                    <td className="px-4 py-3">
                      <p className="text-sm text-slate-700">{item.pieza}</p>
                    </td>

                    <td className="whitespace-nowrap px-4 py-3">
                      <p className="text-sm text-slate-700">{formatMoney(item.valor)}</p>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          statusClasses[item.status] ?? "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <p className="text-sm text-slate-600">{item.observaciones || "Sin observaciones"}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-secondary-dark/60 bg-white p-5 shadow-sm">
            <div className="mb-4 inline-flex rounded-xl bg-secondary/40 p-2 text-primary-dark">
              <FileText className="h-4 w-4" strokeWidth={2} />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Resumen</h3>

            <div className="mt-4 space-y-4 text-sm">
              <div>
                <p className="font-medium text-slate-500">Profesional</p>
                <p className="mt-1 font-semibold capitalize text-slate-900">
                  {atencion.usuario.name} {atencion.usuario.lastName}
                </p>
                <p className="text-slate-600">{atencion.usuario.email}</p>
              </div>

              <div>
                <p className="font-medium text-slate-500">Observaciones generales</p>
                <p className="mt-1 leading-6 text-slate-700">{atencion.observaciones || "Sin observaciones."}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-secondary-dark/60 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">Importes</h3>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-600">Codigos</span>
                <span className="font-semibold text-slate-900">{formatMoney(totalCodigos)}</span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-600">Coseguro</span>
                <span className="font-semibold text-slate-900">{formatMoney(atencion.coseguro)}</span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-600">Coseguro odonto</span>
                <span className="font-semibold text-slate-900">{formatMoney(atencion.coseguroOdonto)}</span>
              </div>

              <div className="border-t border-secondary-dark/40 pt-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-semibold text-slate-900">Total general</span>
                  <span className="text-base font-semibold text-primary-dark">{formatMoney(totalGeneral)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
