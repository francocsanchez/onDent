import type { UseFormRegister, FieldErrors } from "react-hook-form";
import type { UsuarioFormData } from "@/types/index";

type UsuarioFormProps = {
  register: UseFormRegister<UsuarioFormData>;
  errors: FieldErrors<UsuarioFormData>;
};

export default function UsuarioForm({ register, errors }: UsuarioFormProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {/* Nombre */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-700">Nombre</label>

        <input
          type="text"
          {...register("name", {
            required: "El nombre es obligatorio",
          })}
          className="w-full rounded-xl border border-secondary-dark/60 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          placeholder="Ej: Juan"
        />

        {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
      </div>

      {/* Apellido */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-700">Apellido</label>

        <input
          type="text"
          {...register("lastName", {
            required: "El apellido es obligatorio",
          })}
          className="w-full rounded-xl border border-secondary-dark/60 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          placeholder="Ej: Pérez"
        />

        {errors.lastName && <p className="text-xs text-red-500">{errors.lastName.message}</p>}
      </div>

      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-700">Email</label>

        <input
          type="email"
          {...register("email", {
            required: "El email es obligatorio",
          })}
          className="w-full rounded-xl border border-secondary-dark/60 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          placeholder="Ej: usuario@email.com"
        />

        {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
      </div>

      {/* Rol */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-700">Rol</label>

        <select
          {...register("role", {
            required: "El rol es obligatorio",
          })}
          className="w-full rounded-xl border border-secondary-dark/60 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        >
          <option value="" disabled>
            Seleccione un rol
          </option>
          <option value="superadmin">1 - Super admin</option>
          <option value="admin">2 - Admin</option>
          <option value="odontologo">3 - Odontologo</option>
        </select>

        {errors.role && <p className="text-xs text-red-500">{errors.role.message}</p>}
      </div>
    </div>
  );
}
