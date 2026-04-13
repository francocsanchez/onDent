import { updatePacienteById } from "@/api/pacienteAPI";
import type { Paciente, PacienteFormData } from "@/types/index";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import PacienteForm from "./PacienteForm";

type EditPacienteFormProps = {
  paciente: Paciente & {
    obraSocialId?: string;
  };
};

export default function EditPacienteForm({ paciente }: EditPacienteFormProps) {
  const params = useParams();
  const idPaciente = params.idPaciente!;
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const obraSocialId = paciente.obraSocialId ?? paciente.obraSocial?._id ?? "";

  const initialValues: PacienteFormData = {
    name: paciente.name,
    lastName: paciente.lastName,
    dni: paciente.dni,
    obraSocial: obraSocialId,
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PacienteFormData>({ defaultValues: initialValues });

  const mutation = useMutation({
    mutationFn: updatePacienteById,
    onError: (error: Error) => {
      toast.error(error.message);
    },
    onSuccess: (response: { message: string }) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["pacientes", "listar"] });
      queryClient.invalidateQueries({ queryKey: ["edit_paciente", idPaciente] });
      navigate("/pacientes");
    },
  });
  return (
    <>
      <div className="mb-6 flex flex-col gap-4 border-b border-secondary-dark/60 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Pacientes</p>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Editar paciente</h2>
        </div>
      </div>

      <div className="flex-1">
        <form
          onSubmit={handleSubmit((formData) => mutation.mutate({ formData, idPaciente }))}
          className="w-full space-y-5 rounded-2xl border border-secondary-dark/60 bg-white p-6 shadow-sm"
        >
          <PacienteForm register={register} errors={errors} />

          <div className="flex justify-end gap-3 pt-2">
            <Link
              to="/pacientes"
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
