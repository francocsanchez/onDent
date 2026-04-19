import { updateMyPassword } from "@/api/authAPI";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";

type ChangePasswordFormData = {
  password: string;
  repeatPassword: string;
};

const inputClassName =
  "w-full rounded-xl border border-secondary-dark/60 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20";

const readOnlyInputClassName =
  "w-full rounded-xl border border-secondary-dark/50 bg-slate-100 px-3 py-2.5 text-sm text-slate-500 outline-none";

export default function MiPerfilView() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    defaultValues: {
      password: "",
      repeatPassword: "",
    },
  });

  const password = watch("password");

  const mutation = useMutation({
    mutationFn: updateMyPassword,
    onSuccess: (response: { message: string }) => {
      toast.success(response.message);
      reset();
      localStorage.removeItem("AUTH_TOKEN");
      queryClient.removeQueries({ queryKey: ["auth-user"] });
      navigate("/login", { replace: true });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  if (isLoading) {
    return <LoadingSpinner label="Cargando perfil..." />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const onSubmit = (formData: ChangePasswordFormData) => {
    mutation.mutate({
      newPassword: formData.password,
    });
  };

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 border-b border-secondary-dark/60 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Mi perfil</p>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Datos de tu cuenta</h2>
        </div>
      </div>

      <div className="space-y-6">
        <section className="rounded-2xl border border-secondary-dark/60 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h3 className="text-lg font-semibold text-slate-900">Información personal</h3>
            <p className="text-sm text-slate-500">Estos datos corresponden al usuario autenticado.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Nombre</label>
              <input value={user.name} readOnly className={readOnlyInputClassName} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Apellido</label>
              <input value={user.lastName} readOnly className={readOnlyInputClassName} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Email</label>
              <input value={user.email} readOnly className={readOnlyInputClassName} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Rol</label>
              <input value={user.role} readOnly className={readOnlyInputClassName} />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-secondary-dark/60 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h3 className="text-lg font-semibold text-slate-900">Cambiar contraseña</h3>
            <p className="text-sm text-slate-500">Cuando actualices la contraseña se cerrará la sesión actual.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-slate-700">
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="Ingresa una nueva contraseña"
                  className={inputClassName}
                  {...register("password", {
                    validate: (value) => {
                      if (!value && !watch("repeatPassword")) return true;
                      return value.length >= 6 || "La contraseña debe tener al menos 6 caracteres";
                    },
                  })}
                />
                {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="repeatPassword" className="text-sm font-medium text-slate-700">
                  Repetir contraseña
                </label>
                <input
                  id="repeatPassword"
                  type="password"
                  placeholder="Repite la nueva contraseña"
                  className={inputClassName}
                  {...register("repeatPassword", {
                    validate: (value) => {
                      if (!password && !value) return true;
                      return value === password || "Las contraseñas no coinciden";
                    },
                  })}
                />
                {errors.repeatPassword && <p className="text-sm text-red-600">{errors.repeatPassword.message}</p>}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={mutation.isPending}
                className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {mutation.isPending ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </>
  );
}
