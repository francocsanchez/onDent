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

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-700">Límite mensual de prestaciones por paciente</label>

        <input
          type="number"
          min="0"
          step="1"
          {...register("limitePrestacionesMensuales", {
            setValueAs: (value: string) => {
              if (value === "") {
                return null;
              }

              const parsedValue = Number(value);
              return Number.isNaN(parsedValue) ? null : parsedValue;
            },
            validate: (value) => {
              if (value === null || typeof value === "undefined") {
                return true;
              }

              if (!Number.isInteger(value)) {
                return "El límite debe ser un número entero";
              }

              return value >= 0 || "El límite no puede ser negativo";
            },
          })}
          className="w-full rounded-xl border border-secondary-dark/60 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          placeholder="Ej: 4"
        />

        <p className="text-xs text-slate-500">Dejar vacío o en 0 para no aplicar límite mensual.</p>
        {errors.limitePrestacionesMensuales && <p className="text-xs text-red-500">{errors.limitePrestacionesMensuales.message}</p>}
      </div>
    </>
  );
}
