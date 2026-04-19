import { useForm } from "react-hook-form";

type LoginFormData = {
  username: string;
  password: string;
};

export default function LoginView() {
  const initialValues: LoginFormData = {
    username: "",
    password: "",
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({ defaultValues: initialValues });

  const onSubmit = (formData: LoginFormData) => {
    console.log("Login submit", formData);
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
              <label htmlFor="username" className="text-sm font-medium text-slate-700">
                Usuario
              </label>

              <input
                id="username"
                type="text"
                {...register("username", {
                  required: "El usuario es obligatorio",
                })}
                className="w-full rounded-xl border border-secondary-dark/60 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Ingrese su usuario"
              />

              {errors.username && <p className="text-xs text-red-500">{errors.username.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium text-slate-700">
                Contraseña
              </label>

              <input
                id="password"
                type="password"
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
              className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
            >
              Ingresar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
