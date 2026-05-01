import { recoverPassword } from "@/api/authAPI";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { z } from "zod";
import { toast } from "sonner";

const forgotPasswordSchema = z.object({
  email: z.string().trim().min(1, "El email es obligatorio").email("Ingresá un email válido"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordView() {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    defaultValues: {
      email: "",
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: recoverPassword,
    onSuccess: (response: { message?: string }) => {
      toast.success(response.message || "Revisá tu correo para obtener la contraseña temporal");
    },
    onError: (error: Error) => {
      toast.error(error.message || "No se pudo procesar la recuperación");
    },
  });

  const onSubmit = (formData: ForgotPasswordFormData) => {
    const result = forgotPasswordSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;

      if (fieldErrors.email?.[0]) {
        setError("email", { type: "manual", message: fieldErrors.email[0] });
      }

      return;
    }

    forgotPasswordMutation.mutate({
      email: result.data.email.toLowerCase(),
    });
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(21,170,154,0.14),_transparent_34%),linear-gradient(180deg,_#f7fcff_0%,_#e4f3fa_100%)] px-4 py-10 text-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center">
        <div className="w-full overflow-hidden rounded-[2rem] border border-[#b9e1dc] bg-white shadow-[0_35px_90px_-55px_rgba(21,170,154,0.48)]">
          <div className="bg-[#e4f3fa] px-6 py-6 sm:px-8">
            <img src="/logo.png" alt="OnDent" className="h-auto w-full max-w-[180px] object-contain" />
            <h1 className="mt-6 text-2xl font-semibold tracking-tight text-slate-900">Recuperar contraseña</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Ingresá tu email y, si la cuenta está habilitada, te enviaremos una contraseña temporal de acceso.
            </p>
          </div>

          <div className="px-6 py-6 sm:px-8 sm:py-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-sm font-medium text-slate-700">
                  Email
                </label>

                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register("email")}
                  className="w-full rounded-xl border border-[#b8d8e7] bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="usuario@ejemplo.com"
                />

                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
              </div>

              <button
                type="submit"
                disabled={forgotPasswordMutation.isPending}
                className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-70"
              >
                {forgotPasswordMutation.isPending ? "Enviando..." : "Enviar contraseña temporal"}
              </button>
            </form>

            <p className="mt-5 text-sm text-slate-600">
              Después del envío, revisá tu correo y luego iniciá sesión con la contraseña temporal.
            </p>

            <Link
              to="/login"
              className="mt-6 inline-flex items-center text-sm font-semibold text-primary transition hover:text-primary-dark"
            >
              Volver al login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
