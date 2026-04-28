import { getAtencionByID, updateAtencionByID } from "@/api/atencioneAPI";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BadgeDollarSign, FileSearch, Save, Shield, Stethoscope, UserRound } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

const validStatuses = ["OK", "Pendiente", "Denegado", "Diferido", "No cargado"] as const;
type AtencionStatus = (typeof validStatuses)[number];

type AuditAtencionFormValues = {
  codigos: {
    status: AtencionStatus;
    valor: number | "";
  }[];
  coseguroOdonto: number | "";
};

const inputClassName =
  "w-full rounded-xl border border-secondary-dark/60 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20";

const selectClassName =
  "w-full rounded-xl border border-secondary-dark/60 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

const statusClasses: Record<AtencionStatus, string> = {
  OK: "bg-green-50 text-green-700 border border-green-200",
  Pendiente: "bg-amber-50 text-amber-700 border border-amber-200",
  Denegado: "bg-red-50 text-red-700 border border-red-200",
  Diferido: "bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200",
  "No cargado": "bg-gray-100 text-gray-700 border border-gray-200",
};

const getMontoLiquidable = (
  codigos: {
    status: AtencionStatus;
    valor: number | "";
  }[],
) => codigos.reduce((acc, item) => acc + (item.status === "OK" && item.valor !== "" ? Number(item.valor) : 0), 0);

export default function AuditarAtencionView() {
  const { idAtencion, idUsuario, estado: rawEstado } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const periodo = searchParams.get("periodo")?.trim() ?? "";
  const estado = validStatuses.includes(rawEstado as AtencionStatus) ? (rawEstado as AtencionStatus) : null;

  const {
    data: atencion,
    isError,
    isLoading,
  } = useQuery({
    queryKey: ["atencion", idAtencion],
    queryFn: () => getAtencionByID(idAtencion!),
    enabled: !!idAtencion,
    retry: false,
  });

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AuditAtencionFormValues>({
    values: atencion
      ? {
          codigos: atencion.codigos.map((codigo) => ({
            status: codigo.status,
            valor: codigo.valor,
          })),
          coseguroOdonto: atencion.coseguroOdonto ?? "",
        }
      : undefined,
  });

  const { fields } = useFieldArray({
    control,
    name: "codigos",
  });

  const watchedCodigos = watch("codigos");
  const watchedCoseguroOdonto = watch("coseguroOdonto");

  const mutation = useMutation({
    mutationFn: updateAtencionByID,
    onSuccess: (response: { message: string }) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["atencion", idAtencion] });
      queryClient.invalidateQueries({ queryKey: ["atenciones", "listar"] });
      queryClient.invalidateQueries({ queryKey: ["atenciones", "filtrar"] });
      queryClient.invalidateQueries({ queryKey: ["atenciones", "resumen"] });
      queryClient.invalidateQueries({ queryKey: ["reportes", "atenciones", "usuario", idUsuario] });
      navigate(getBackPath());
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

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

  function getBackPath() {
    if (!estado || !idUsuario) return "/reports";
    const query = periodo ? `?periodo=${encodeURIComponent(periodo)}` : "";
    return `/reports/atenciones/${encodeURIComponent(estado)}/${idUsuario}${query}`;
  }

  if (!idAtencion) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
        El identificador de la atención no es válido.
      </div>
    );
  }

  if (isLoading) {
    return <LoadingSpinner label="Cargando auditoría de atención..." />;
  }

  if (isError || !atencion) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
        Ocurrió un error al cargar la atención para auditoría.
      </div>
    );
  }

  const totalCodigos = getMontoLiquidable(watchedCodigos ?? []);
  const totalGeneral = totalCodigos + (watchedCoseguroOdonto === "" || watchedCoseguroOdonto === undefined ? 0 : Number(watchedCoseguroOdonto));
  const totalPendiente = (watchedCodigos ?? []).reduce((acc, item) => {
    if (!item || item.valor === "" || item.valor === undefined || item.status === "OK") return acc;
    return acc + Number(item.valor);
  }, 0);

  const onSubmit = (formData: AuditAtencionFormValues) => {
    mutation.mutate({
      idAtencion,
      fecha: atencion.fecha,
      paciente: atencion.paciente._id,
      usuario: atencion.usuario._id,
      obraSocial: atencion.obraSocial._id,
      codigos: atencion.codigos.map((item, index) => ({
        codigo: item.codigo._id,
        pieza: item.pieza,
        valor: formData.codigos[index].valor === "" ? 0 : Number(formData.codigos[index].valor),
        status: formData.codigos[index].status,
        observaciones: item.observaciones?.trim() || undefined,
      })),
      observaciones: atencion.observaciones?.trim() || undefined,
      coseguro: atencion.coseguro ?? 0,
      coseguroOdonto: formData.coseguroOdonto === "" ? 0 : Number(formData.coseguroOdonto),
    });
  };

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 border-b border-secondary-dark/60 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Reportes</p>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Auditar atención</h2>
          <p className="mt-1 text-sm text-slate-500">
            Se muestra toda la información de la atención y solo se habilita la edición administrativa.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to={getBackPath()}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-secondary-dark/60 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-primary/40 hover:bg-secondary/40 hover:text-primary-dark"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2.2} />
            <span>Volver al reporte</span>
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <section className="rounded-2xl border border-secondary-dark/60 bg-white p-4 shadow-sm sm:p-5">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl bg-secondary/20 px-3 py-3">
              <div className="flex items-start gap-3">
                <div className="inline-flex rounded-lg bg-secondary/50 p-2 text-primary-dark">
                  <UserRound className="h-4 w-4" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Paciente</p>
                  <p className="mt-1 text-sm font-semibold uppercase text-slate-900">
                    {atencion.paciente.lastName} {atencion.paciente.name}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-600">DNI {atencion.paciente.dni}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-secondary/20 px-3 py-3">
              <div className="flex items-start gap-3">
                <div className="inline-flex rounded-lg bg-secondary/50 p-2 text-primary-dark">
                  <Stethoscope className="h-4 w-4" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Profesional</p>
                  <p className="mt-1 text-sm font-semibold uppercase text-slate-900">
                    {atencion.usuario.lastName} {atencion.usuario.name}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-600">{formatFecha(atencion.fecha)}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-secondary/20 px-3 py-3">
              <div className="flex items-start gap-3">
                <div className="inline-flex rounded-lg bg-secondary/50 p-2 text-primary-dark">
                  <Shield className="h-4 w-4" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Obra social</p>
                  <p className="mt-1 text-sm font-semibold uppercase text-slate-900">{atencion.obraSocial.name}</p>
                  <p className="mt-0.5 text-xs text-slate-600">{atencion.codigos.length} códigos cargados</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-secondary/20 px-3 py-3">
              <div className="flex items-start gap-3">
                <div className="inline-flex rounded-lg bg-secondary/50 p-2 text-primary-dark">
                  <BadgeDollarSign className="h-4 w-4" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Total liquidable</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{formatMoney(totalGeneral)}</p>
                  <p className="mt-0.5 text-xs text-slate-600">Códigos OK + coseguro odonto</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
            <div className="rounded-xl border border-secondary-dark/50 bg-secondary/10 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Observación general</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{atencion.observaciones || "Sin observaciones."}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-xl border border-secondary-dark/50 bg-secondary/10 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Coseguro</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{formatMoney(atencion.coseguro)}</p>
                <p className="mt-0.5 text-xs text-slate-500">Solo lectura</p>
              </div>

              <div className="rounded-xl border border-secondary-dark/50 bg-secondary/10 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Filtros del reporte</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {estado ? (
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses[estado]}`}>{estado}</span>
                  ) : null}
                  {periodo ? <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600">{periodo}</span> : null}
                </div>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-800">Monto pendiente</p>
                <p className="mt-2 text-sm font-semibold text-amber-900">{formatMoney(totalPendiente)}</p>
                <p className="mt-0.5 text-xs text-amber-700">Suma códigos no OK</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-secondary-dark/60 bg-white shadow-sm">
          <div className="border-b border-secondary-dark/40 px-4 py-4 sm:px-5">
            <div className="flex items-start gap-3">
              <div className="inline-flex rounded-lg bg-secondary/50 p-2 text-primary-dark">
                <FileSearch className="h-4 w-4" strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Códigos auditables</h3>
                <p className="mt-1 text-sm text-slate-600">
                  El administrador puede modificar estado y valor de cada código. La descripción clínica queda visible en forma compacta.
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="border-b border-secondary-dark/50 bg-secondary/40">
                <tr>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Código</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Detalle</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Estado</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Valor</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-secondary-dark/40">
                {fields.map((field, index) => {
                  const codigo = atencion.codigos[index];

                  return (
                    <tr key={field.id} className="align-top transition-colors hover:bg-secondary/20">
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-slate-900">{codigo.codigo.code}</p>
                        <p className="mt-1 text-xs text-slate-500">Pieza {codigo.pieza || "Sin especificar"}</p>
                      </td>

                      <td className="px-4 py-3">
                        <p className="text-sm text-slate-700">{codigo.codigo.description.trim()}</p>
                        <p className="mt-2 text-xs leading-5 text-slate-500">{codigo.observaciones || "Sin observaciones del profesional."}</p>
                      </td>

                      <td className="px-4 py-3">
                        <select className={`${selectClassName} min-w-[170px]`} {...register(`codigos.${index}.status`, { required: true })}>
                          {validStatuses.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className={`${inputClassName} min-w-[140px]`}
                          {...register(`codigos.${index}.valor`, {
                            setValueAs: (value) => (value === "" ? "" : Number(value)),
                            validate: (value) => value === "" || value >= 0 || "El valor no puede ser negativo",
                          })}
                        />
                        {errors.codigos?.[index]?.valor ? <p className="mt-2 text-sm text-rose-600">{errors.codigos[index]?.valor?.message}</p> : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-secondary-dark/60 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-[260px_minmax(0,1fr)]">
            <div className="space-y-2">
              <label htmlFor="coseguroOdonto" className="text-sm font-medium text-slate-700">
                Coseguro Odonto
              </label>
              <input
                id="coseguroOdonto"
                type="number"
                min="0"
                step="0.01"
                className={inputClassName}
                {...register("coseguroOdonto", {
                  setValueAs: (value) => (value === "" ? "" : Number(value)),
                  validate: (value) => value === "" || value >= 0 || "El coseguro odonto no puede ser negativo",
                })}
              />
              {errors.coseguroOdonto ? <p className="text-sm text-rose-600">{errors.coseguroOdonto.message}</p> : null}
            </div>

            <div className="rounded-xl border border-secondary-dark/50 bg-secondary/10 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Resumen de auditoría</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-500">Total códigos</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{formatMoney(totalCodigos)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Total general</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{formatMoney(totalGeneral)}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(getBackPath())}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-secondary-dark/60 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-primary/40 hover:bg-secondary/40 hover:text-primary-dark"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2.2} />
            <span>Cancelar</span>
          </button>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" strokeWidth={2.2} />
            <span>{mutation.isPending ? "Guardando..." : "Guardar auditoría"}</span>
          </button>
        </div>
      </form>
    </>
  );
}
