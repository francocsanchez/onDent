import { authenticateUser, recoverPassword } from "@/api/authAPI";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

type LoginFormData = {
  email: string;
  password: string;
};

export default function LoginView() {
  const navigate = useNavigate();

  const initialValues: LoginFormData = {
    email: "",
    password: "",
  };

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<LoginFormData>({ defaultValues: initialValues });

  const loginMutation = useMutation({
    mutationFn: authenticateUser,
    onSuccess: () => {
      navigate("/", { replace: true });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al iniciar sesión");
    },
  });

  const recoverPasswordMutation = useMutation({
    mutationFn: recoverPassword,
    onSuccess: (response: { message?: string }) => {
      toast.success(response.message || "Te enviamos una nueva contraseña temporal a tu correo");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al recuperar la contraseña");
    },
  });

  const onSubmit = (formData: LoginFormData) => {
    loginMutation.mutate({
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
    });
  };

  const handleRecoverPassword = () => {
    const email = getValues("email").trim().toLowerCase();

    if (!email) {
      toast.error("Ingresá tu email para recuperar la contraseña");
      return;
    }

    recoverPasswordMutation.mutate({ email });
  };

  return (
    <div className="min-h-screen bg-white px-4 py-10 text-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center">
        <div className="w-full rounded-[1.75rem] border border-secondary-dark/60 bg-white p-6 shadow-[0_30px_80px_-60px_rgba(14,124,114,0.45)] sm:p-8">
          <div className="mb-6 border-b border-secondary-dark/60 pb-5">
            <img src="/logo.png" alt="OnDent" className="h-auto w-full max-w-[180px] object-contain" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-slate-700">
                Email
              </label>

              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register("email", {
                  required: "El email es obligatorio",
                })}
                className="w-full rounded-xl border border-secondary-dark/60 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Ingrese su email"
              />

              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium text-slate-700">
                Contraseña
              </label>

              <input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register("password", {
                  required: "La contraseña es obligatoria",
                })}
                className="w-full rounded-xl border border-secondary-dark/60 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Ingrese su contraseña"
              />

              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
            >
              {loginMutation.isPending ? "Ingresando..." : "Ingresar"}
            </button>

            <button
              type="button"
              onClick={handleRecoverPassword}
              disabled={recoverPasswordMutation.isPending}
              className="inline-flex w-full items-center justify-center rounded-xl border border-secondary-dark/60 bg-white px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-secondary/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {recoverPasswordMutation.isPending ? "Enviando correo..." : "Olvidé mi contraseña"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
