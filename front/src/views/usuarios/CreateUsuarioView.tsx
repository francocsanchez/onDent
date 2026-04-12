import { createUsuario } from "@/api/usuarioAPI";
import UsuarioForm from "@/components/usuarios/UsuarioForm";
import type { UsuarioFormData } from "@/types/index";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function CreateUsuarioView() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const initialValues: UsuarioFormData = {
    name: "",
    lastName: "",
    email: "",
    role: "",
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: initialValues });

  const mutation = useMutation({
    mutationFn: createUsuario,
    onError: (error: Error) => {
      toast.error(error.message);
    },
    onSuccess: (response: { message: string }) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["usuarios", "listar"] });
      navigate("/config/usuarios");
    },
  });

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 border-b border-secondary-dark/60 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Usuarios</p>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Crear nuevo usuario</h2>
        </div>
      </div>

      <div className="flex-1">
        <form
          onSubmit={handleSubmit((formData) => mutation.mutate(formData))}
          className="w-full space-y-5 rounded-2xl border border-secondary-dark/60 bg-white p-6 shadow-sm"
        >
          <UsuarioForm register={register} errors={errors} />

          <div className="flex justify-end gap-3 pt-2">
            <Link
              to="/config/usuarios"
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
