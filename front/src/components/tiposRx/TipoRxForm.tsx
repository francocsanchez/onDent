import type { FieldErrors, UseFormRegister } from "react-hook-form";
import type { TipoRxFormData } from "@/types/index";

type TipoRxFormProps = {
  register: UseFormRegister<TipoRxFormData>;
  errors: FieldErrors<TipoRxFormData>;
};

export default function TipoRxForm({ register, errors }: TipoRxFormProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-700">Nombre</label>

      <input
        type="text"
        {...register("name", {
          required: "El nombre es obligatorio",
        })}
        className="w-full rounded-xl border border-secondary-dark/60 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        placeholder="Ej: panorámica, periapical..."
      />

      {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
    </div>
  );
}
