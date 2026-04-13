import { getObrasSociales } from "@/api/obraSocialAPI";
import LoadingSpinner from "@/components/LoadingSpinner";
import type { UseFormRegister, FieldErrors } from "react-hook-form";
import type { PacienteFormData } from "@/types/index";
import { useQuery } from "@tanstack/react-query";

type PacienteProps = {
  register: UseFormRegister<PacienteFormData>;
  errors: FieldErrors<PacienteFormData>;
};

export default function PacienteForm({ register, errors }: PacienteProps) {
  const {
    data: obrasSociales,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["obras_sociales", "listar"],
    queryFn: getObrasSociales,
  });

  if (isLoading) {
    return <LoadingSpinner label="Cargando obras sociales..." className="min-h-[180px]" />;
  }

  if (isError || !obrasSociales) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
        Ocurrió un error al cargar las obras sociales.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-700">Apellido</label>

        <input
          type="text"
          {...register("lastName", {
            required: "El apellido es obligatorio",
          })}
          className="w-full rounded-xl border border-secondary-dark/60 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          placeholder="Ej: Perez"
        />

        {errors.lastName && <p className="text-xs text-red-500">{errors.lastName.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-700">DNI</label>

        <input
          type="number"
          {...register("dni", {
            required: "El DNI es obligatorio",
            valueAsNumber: true,
            min: {
              value: 1,
              message: "El DNI debe ser mayor a 0",
            },
          })}
          className="w-full rounded-xl border border-secondary-dark/60 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          placeholder="Ej: 36435347"
        />

        {errors.dni && <p className="text-xs text-red-500">{errors.dni.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-700">Obra social</label>

        <select
          {...register("obraSocial", {
            required: "La obra social es obligatoria",
          })}
          className="w-full rounded-xl border border-secondary-dark/60 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        >
          <option value="" disabled>
            Seleccione una obra social
          </option>

          {obrasSociales
            .filter((obraSocial) => obraSocial.enable)
            .map((obraSocial) => (
              <option key={obraSocial._id} value={obraSocial._id}>
                {obraSocial.name}
              </option>
            ))}
        </select>

        {errors.obraSocial && <p className="text-xs text-red-500">{errors.obraSocial.message}</p>}
      </div>
    </div>
  );
}
