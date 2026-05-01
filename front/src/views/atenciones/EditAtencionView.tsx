import { getAtencionByID, getCodigosByObraSocial, updateAtencionByID } from "@/api/atencioneAPI";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useAuth } from "@/hooks/useAuth";
import type { Codigo } from "@/types/index";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

type EditAtencionFormValues = {
  codigos: {
    codigo: string;
    pieza: string;
    observaciones: string;
  }[];
  observaciones: string;
  coseguro: number | "";
};

const inputClassName =
  "w-full rounded-xl border border-secondary-dark/60 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20";

const textareaClassName =
  "w-full rounded-xl border border-secondary-dark/60 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20";

export default function EditAtencionView() {
  const params = useParams();
  const idAtencion = params.idAtencion!;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const {
    data: atencion,
    isError: isAtencionError,
    isLoading: isAtencionLoading,
  } = useQuery({
    queryKey: ["atencion", idAtencion],
    queryFn: () => getAtencionByID(idAtencion),
    retry: false,
  });

  const { data: availableCodes, isLoading: isCodesLoading } = useQuery({
    queryKey: ["codigos", "obra-social", atencion?.obraSocial._id],
    queryFn: () => getCodigosByObraSocial(atencion!.obraSocial._id),
    enabled: !!atencion?.obraSocial._id,
  });

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditAtencionFormValues>({
    values: atencion
      ? {
          codigos: atencion.codigos.map((item) => ({
            codigo: item.codigo._id,
            pieza: item.pieza,
            observaciones: item.observaciones ?? "",
          })),
          observaciones: atencion.observaciones ?? "",
          coseguro: atencion.coseguro ?? "",
        }
      : undefined,
  });

  const { fields } = useFieldArray({
    control,
    name: "codigos",
  });

  const mutation = useMutation({
    mutationFn: updateAtencionByID,
    onSuccess: (response: { message: string }) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["atencion", idAtencion] });
      queryClient.invalidateQueries({ queryKey: ["atenciones", "listar"] });
      queryClient.invalidateQueries({ queryKey: ["atenciones", "filtrar"] });
      queryClient.invalidateQueries({ queryKey: ["atenciones", "resumen"] });
      navigate(`/atenciones/${idAtencion}`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  if (isAtencionLoading || isCodesLoading) {
    return <LoadingSpinner label="Cargando atención..." />;
  }

  if (isAtencionError || !atencion) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
        Ocurrió un error al cargar la atención.
      </div>
    );
  }

  const canEditAnyCodigo = user?.role === "admin" || user?.role === "superadmin";
  const isCodigoLocked = (status: string) => !canEditAnyCodigo && user?.role === "odontologo" && status !== "Pendiente";

  const onSubmit = (formData: EditAtencionFormValues) => {
    mutation.mutate({
      idAtencion,
      fecha: atencion.fecha,
      paciente: atencion.paciente._id,
      usuario: atencion.usuario._id,
      obraSocial: atencion.obraSocial._id,
      codigos: atencion.codigos.map((item, index) => ({
        codigo: isCodigoLocked(item.status) ? item.codigo._id : formData.codigos[index].codigo,
        pieza: isCodigoLocked(item.status) ? item.pieza : formData.codigos[index].pieza.trim(),
        valor: item.valor,
        status: item.status,
        observaciones: isCodigoLocked(item.status)
          ? item.observaciones
          : formData.codigos[index].observaciones.trim() || undefined,
      })),
      observaciones: formData.observaciones.trim() || undefined,
      coseguro: formData.coseguro === "" ? 0 : formData.coseguro,
      coseguroOdonto: atencion.coseguroOdonto ?? 0,
    });
  };

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 border-b border-secondary-dark/60 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Atenciones</p>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Editar atención</h2>
          <p className="mt-1 text-sm text-slate-500">Podés modificar código, pieza, observaciones y coseguro.</p>
          {user?.role === "odontologo" ? (
            <p className="mt-2 text-sm text-amber-700">Solo podés editar códigos en estado Pendiente. Los ya auditados quedan bloqueados.</p>
          ) : null}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <section className="rounded-2xl border border-secondary-dark/60 bg-white p-5 shadow-sm">
          <div className="mb-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl bg-secondary/20 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Paciente</p>
              <p className="mt-1 text-sm font-semibold uppercase text-slate-900">
                {atencion.paciente.lastName} {atencion.paciente.name}
              </p>
            </div>

            <div className="rounded-xl bg-secondary/20 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Obra social</p>
              <p className="mt-1 text-sm font-semibold uppercase text-slate-900">{atencion.obraSocial.name}</p>
            </div>

            <div className="rounded-xl bg-secondary/20 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Fecha</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{atencion.fecha}</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-secondary-dark/50">
            <table className="min-w-full">
              <thead className="border-b border-secondary-dark/50 bg-secondary/40">
                <tr>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Código</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Pieza</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Observación</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-secondary-dark/40">
                {fields.map((field, index) => (
                  <tr key={field.id} className="align-top transition-colors hover:bg-secondary/20">
                    <td className="px-4 py-3">
                      {isCodigoLocked(atencion.codigos[index].status) ? (
                        <p className="mb-2 text-xs font-medium text-slate-500">Bloqueado por auditoría: {atencion.codigos[index].status}</p>
                      ) : null}
                      <select
                        className={`${inputClassName} max-w-[320px]`}
                        disabled={isCodigoLocked(atencion.codigos[index].status)}
                        {...register(`codigos.${index}.codigo`, {
                          required: "El código es obligatorio",
                        })}
                      >
                        <option value="">Seleccionar código</option>
                        {(availableCodes ?? []).map((code: Codigo) => (
                          <option key={code._id} value={code._id}>
                            {code.code} - {code.description.trim()}
                          </option>
                        ))}
                      </select>
                      {errors.codigos?.[index]?.codigo ? (
                        <p className="mt-2 text-sm text-rose-600">{errors.codigos[index]?.codigo?.message}</p>
                      ) : null}
                    </td>

                    <td className="px-4 py-3">
                      <input
                        placeholder="Ej: 14"
                        readOnly={isCodigoLocked(atencion.codigos[index].status)}
                        className={`${inputClassName} max-w-[96px] ${isCodigoLocked(atencion.codigos[index].status) ? "bg-slate-100 text-slate-500" : ""}`}
                        {...register(`codigos.${index}.pieza`, {})}
                      />
                      {errors.codigos?.[index]?.pieza ? <p className="mt-2 text-sm text-rose-600">{errors.codigos[index]?.pieza?.message}</p> : null}
                    </td>

                    <td className="px-4 py-3">
                      <textarea
                        rows={2}
                        readOnly={isCodigoLocked(atencion.codigos[index].status)}
                        className={`${textareaClassName} min-w-[360px] ${isCodigoLocked(atencion.codigos[index].status) ? "bg-slate-100 text-slate-500" : ""}`}
                        {...register(`codigos.${index}.observaciones`)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-secondary-dark/60 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
            <div className="space-y-2">
              <label htmlFor="coseguro" className="text-sm font-medium text-slate-700">
                Coseguro
              </label>
              <input
                id="coseguro"
                type="number"
                min="0"
                step="0.01"
                className={inputClassName}
                {...register("coseguro", {
                  setValueAs: (value) => (value === "" ? "" : Number(value)),
                  validate: (value) => value === "" || value >= 0 || "El coseguro no puede ser negativo",
                })}
              />
              {errors.coseguro ? <p className="text-sm text-rose-600">{errors.coseguro.message}</p> : null}
            </div>

            <div className="space-y-2">
              <label htmlFor="observaciones" className="text-sm font-medium text-slate-700">
                Observación general
              </label>
              <textarea id="observaciones" rows={4} className={textareaClassName} {...register("observaciones")} />
            </div>
          </div>
        </section>

        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
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
            <span>{mutation.isPending ? "Guardando..." : "Guardar cambios"}</span>
          </button>
        </div>
      </form>
    </>
  );
}
