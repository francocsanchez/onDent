import type { UseFormRegister, FieldErrors } from "react-hook-form";
import type { ObraSocialFormData } from "@/types/index";

type ObraSocialFormProps = {
  register: UseFormRegister<ObraSocialFormData>;
  errors: FieldErrors<ObraSocialFormData>;
};
export default function ObraSocialForm({ register, errors }: ObraSocialFormProps) {
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-700">Nombre</label>

        <input
          type="text"
          {...register("name", {
            required: "El nombre es obligatorio",
          })}
          className="w-full rounded-xl border border-secondary-dark/60 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          placeholder="Ej: OSDE, Swiss Medical..."
        />

        {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
      </div>
    </>
  );
}
