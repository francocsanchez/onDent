import ObraSocialForm from "./ObraSocialForm";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { ObraSocialFormData } from "@/types/index";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateObraSocialById } from "@/api/obraSocialAPI";

type EditObraSocialFormProps = { obraSocial: ObraSocialFormData };

export default function EditObraSocialForm({ obraSocial }: EditObraSocialFormProps) {
  const params = useParams();
  const idObraSocial = params.idObraSocial!;
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const initialValues: ObraSocialFormData = {
    name: obraSocial.name,
    limitePrestacionesMensuales: obraSocial.limitePrestacionesMensuales ?? null,
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: initialValues });

  const mutation = useMutation({
    mutationFn: updateObraSocialById,
    onError: (error: Error) => {
      toast.error(error.message);
    },
    onSuccess: (response: { message: string }) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["obras_sociales", "listar"] });
      queryClient.invalidateQueries({ queryKey: ["edit_obra_social", idObraSocial] });
      navigate("/config/obras-sociales");
    },
  });

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 border-b border-secondary-dark/60 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Obras sociales</p>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Editar obra social</h2>
        </div>
      </div>

      <div className="flex-1">
        <form
          onSubmit={handleSubmit((formData) => mutation.mutate({ formData, idObraSocial }))}
          className="w-full space-y-5 rounded-2xl border border-secondary-dark/60 bg-white p-6 shadow-sm"
        >
          <ObraSocialForm register={register} errors={errors} />

          <div className="flex justify-end gap-3 pt-2">
            <Link
              to="/config/obras-sociales"
              className="inline-flex items-center justify-center rounded-xl border border-secondary-dark/60 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-secondary/40"
            >
              Cancelar
            </Link>

            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
