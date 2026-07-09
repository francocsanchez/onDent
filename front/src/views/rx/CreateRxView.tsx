import { getPacienteByDNI } from "@/api/atencioneAPI";
import { createRx, getRxFilters } from "@/api/rxAPI";
import { getPacienteByID } from "@/api/pacienteAPI";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useAuth } from "@/hooks/useAuth";
import type { Paciente, RxFilters } from "@/types/index";
import { getTodayDateLocal } from "@/utils/date";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

type SearchStatus = "idle" | "found" | "not-found";
type DerivanteTipo = "interno" | "externo";

type CreateRxFormValues = {
  fecha: string;
  patientSearchDni: string;
  patientId: string;
  derivanteTipo: DerivanteTipo;
  derivanteUsuario: string;
  derivanteExterno: string;
  tipoRx: string;
  valor: number | "";
  observacion: string;
};

const inputBaseClassName =
  "w-full rounded-lg border border-secondary-dark/60 bg-white px-1.5 py-1 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20";

export default function CreateRxView() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const patientIdFromQuery = searchParams.get("pacienteId")?.trim() ?? "";
  const [foundPatient, setFoundPatient] = useState<Paciente | null>(null);
  const [searchStatus, setSearchStatus] = useState<SearchStatus>("idle");

  const { data: filtersData } = useQuery({
    queryKey: ["rx", "filtros"],
    queryFn: getRxFilters,
  });

  const { register, handleSubmit, watch, setValue, getValues, formState: { errors } } = useForm<CreateRxFormValues>({
    defaultValues: {
      fecha: getTodayDateLocal(),
      patientSearchDni: "",
      patientId: "",
      derivanteTipo: "interno",
      derivanteUsuario: "",
      derivanteExterno: "",
      tipoRx: "",
      valor: "",
      observacion: "",
    },
  });

  const derivanteTipo = watch("derivanteTipo");

  const handlePatientFound = (patient: Paciente) => {
    setFoundPatient(patient);
    setSearchStatus("found");
    setValue("patientId", patient._id);
    setValue("patientSearchDni", String(patient.dni));
  };

  const searchPatientMutation = useMutation({
    mutationFn: getPacienteByDNI,
    onSuccess: handlePatientFound,
    onError: () => {
      setFoundPatient(null);
      setSearchStatus("not-found");
      setValue("patientId", "");
    },
  });

  const searchPatientByIdMutation = useMutation({
    mutationFn: getPacienteByID,
    onSuccess: handlePatientFound,
    onError: () => {
      setFoundPatient(null);
      setSearchStatus("not-found");
      setValue("patientId", "");
    },
  });

  const createRxMutation = useMutation({
    mutationFn: createRx,
    onSuccess: (response: { message: string }) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["rx", "listar"] });
      queryClient.invalidateQueries({ queryKey: ["pacientes", "atenciones", foundPatient?._id] });
      navigate("/rx");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const performPatientSearch = (dniToSearch?: string) => {
    const normalizedDni = (dniToSearch ?? getValues("patientSearchDni")).trim();
    if (!normalizedDni || !/^\d+$/.test(normalizedDni) || normalizedDni.length < 7) {
      setFoundPatient(null);
      setSearchStatus("idle");
      setValue("patientId", "");
      return;
    }

    setSearchStatus("idle");
    searchPatientMutation.mutate(normalizedDni);
  };

  useEffect(() => {
    if (!patientIdFromQuery || foundPatient?._id === patientIdFromQuery) return;
    setSearchStatus("idle");
    searchPatientByIdMutation.mutate(patientIdFromQuery);
  }, [patientIdFromQuery, foundPatient?._id, searchPatientByIdMutation]);

  if (isLoading) return <LoadingSpinner label="Cargando usuario..." />;
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;

  const onSubmit = (formData: CreateRxFormValues) => {
    if (!foundPatient) return;

    createRxMutation.mutate({
      fecha: formData.fecha,
      paciente: foundPatient._id,
      derivanteTipo: formData.derivanteTipo,
      derivanteUsuario: formData.derivanteTipo === "interno" ? formData.derivanteUsuario : undefined,
      derivanteExterno: formData.derivanteTipo === "externo" ? formData.derivanteExterno.trim() : undefined,
      tipoRx: formData.tipoRx,
      valor: formData.valor === "" ? undefined : Number(formData.valor),
      usuarioCarga: user._id,
      observacion: formData.observacion.trim() || undefined,
    });
  };

  const canShowFormSections = foundPatient !== null;
  const filters = filtersData as RxFilters | undefined;

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 border-b border-secondary-dark/60 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Radiografías</p>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Registrar nueva RX</h2>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <section className="overflow-hidden rounded-[1.35rem] border border-secondary-dark/60 bg-white shadow-sm">
          <div className="border-b border-secondary-dark/50 bg-gradient-to-r from-secondary/50 via-white to-white px-3 py-2.5">
            <p className="text-sm font-medium text-primary">Paso 1</p>
            <h3 className="text-base font-semibold text-slate-900">Búsqueda de paciente</h3>
            <p className="mt-0.5 text-sm text-slate-500">Ingresá el DNI para validar si el paciente ya existe en el sistema.</p>
          </div>

          <div className="grid gap-3 px-3 py-3 lg:grid-cols-[220px_minmax(0,1fr)_auto] lg:items-end">
            <div className="space-y-1.5">
              <label htmlFor="fecha" className="text-sm font-medium text-slate-700">Fecha de RX</label>
              <div className="relative">
                <input id="fecha" type="date" className={`${inputBaseClassName} pr-10`} {...register("fecha", { required: "La fecha es obligatoria" })} />
                <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
              {errors.fecha ? <p className="text-sm text-rose-600">{errors.fecha.message}</p> : null}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="patientSearchDni" className="text-sm font-medium text-slate-700">DNI del paciente</label>
              <input
                id="patientSearchDni"
                type="text"
                inputMode="numeric"
                placeholder="Ej: 31245780"
                className={inputBaseClassName}
                {...register("patientSearchDni", {
                  setValueAs: (value: string) => value.replace(/\D/g, ""),
                  onChange: () => {
                    if (foundPatient || searchStatus !== "idle") {
                      setFoundPatient(null);
                      setSearchStatus("idle");
                      setValue("patientId", "");
                    }
                  },
                })}
              />
            </div>

            <button type="button" onClick={() => performPatientSearch()} disabled={searchPatientMutation.isPending || searchPatientByIdMutation.isPending} className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-lg bg-primary text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-slate-300" aria-label="Buscar paciente" title="Buscar paciente">
              <Search className={`h-4 w-4 ${searchPatientMutation.isPending || searchPatientByIdMutation.isPending ? "animate-pulse" : ""}`} />
            </button>
          </div>

          {searchStatus === "found" && foundPatient ? (
            <div className="border-t border-emerald-100 bg-emerald-50/70 px-3 py-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-emerald-700">Paciente encontrado</p>
                  <p className="text-sm text-emerald-600">Podés continuar con la carga de la RX.</p>
                </div>
                <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Validado</span>
              </div>
              <div className="mt-2 rounded-lg border border-emerald-100 bg-white px-2.5 py-2">
                <div className="flex flex-col gap-1.5 text-sm text-slate-700 md:flex-row md:items-center md:gap-3">
                  <span className="font-semibold text-slate-900">{foundPatient.lastName}, {foundPatient.name}</span>
                  <span className="hidden text-slate-300 md:inline">|</span>
                  <span><span className="font-medium text-slate-500">DNI:</span> {String(foundPatient.dni)}</span>
                  <span className="hidden text-slate-300 md:inline">|</span>
                  <span><span className="font-medium text-slate-500">Obra social:</span> {foundPatient.obraSocial.name}</span>
                </div>
              </div>
            </div>
          ) : null}

          {searchStatus === "not-found" ? (
            <div className="border-t border-rose-100 bg-rose-50/70 px-3 py-2.5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-rose-700">Paciente inexistente</p>
                  <p className="text-sm text-rose-600">No encontramos un paciente con ese DNI.</p>
                </div>
                <Link to="/pacientes/create" className="inline-flex items-center justify-center rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100">
                  Crear paciente
                </Link>
              </div>
            </div>
          ) : null}
        </section>

        <section className={`overflow-hidden rounded-[1.35rem] border border-secondary-dark/60 bg-white shadow-sm transition ${canShowFormSections ? "opacity-100" : "pointer-events-none opacity-60"}`}>
          <div className="border-b border-secondary-dark/50 bg-gradient-to-r from-slate-50 via-white to-white px-3 py-2.5">
            <p className="text-sm font-medium text-primary">Paso 2</p>
            <h3 className="text-base font-semibold text-slate-900">Datos de la RX</h3>
            <p className="mt-0.5 text-sm text-slate-500">Completá el derivante, el tipo de estudio y los datos del registro.</p>
          </div>

          <div className="space-y-3 px-3 py-3">
            {!canShowFormSections ? <div className="rounded-xl border border-dashed border-secondary-dark/60 bg-slate-50 px-3 py-5 text-center text-sm text-slate-500">Primero buscá y validá un paciente para habilitar la carga.</div> : null}

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Odontólogo derivante</label>
                <select className={inputBaseClassName} {...register("derivanteTipo", { required: "Debés seleccionar un derivante" })}>
                  <option value="interno">Odontólogo interno</option>
                  <option value="externo">Externo</option>
                </select>
              </div>

              {derivanteTipo === "interno" ? (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Profesional</label>
                  <select className={inputBaseClassName} {...register("derivanteUsuario", { validate: (value) => derivanteTipo !== "interno" || value ? true : "Seleccioná un odontólogo" })}>
                    <option value="">Seleccionar odontólogo</option>
                    {(filters?.odontologos ?? []).map((odontologo) => (
                      <option key={odontologo._id} value={odontologo._id}>{odontologo.lastName}, {odontologo.name}</option>
                    ))}
                  </select>
                  {errors.derivanteUsuario ? <p className="text-sm text-rose-600">{errors.derivanteUsuario.message}</p> : null}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Derivante externo</label>
                  <input type="text" className={inputBaseClassName} placeholder="Ej: Dr. Juan Pérez" {...register("derivanteExterno", { validate: (value) => derivanteTipo !== "externo" || value.trim() ? true : "Ingresá el derivante externo" })} />
                  {errors.derivanteExterno ? <p className="text-sm text-rose-600">{errors.derivanteExterno.message}</p> : null}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Tipo de RX</label>
                <select className={inputBaseClassName} {...register("tipoRx", { required: "Seleccioná un tipo de RX" })}>
                  <option value="">Seleccionar tipo de RX</option>
                  {(filters?.tiposRx ?? []).map((tipoRx) => (
                    <option key={tipoRx._id} value={tipoRx._id}>{tipoRx.name}</option>
                  ))}
                </select>
                {errors.tipoRx ? <p className="text-sm text-rose-600">{errors.tipoRx.message}</p> : null}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Valor</label>
                <input type="number" min="0" step="0.01" className={inputBaseClassName} placeholder="Opcional" {...register("valor", { setValueAs: (value) => value === "" ? "" : Number(value), validate: (value) => value === "" || Number(value) >= 0 ? true : "Ingresá un valor válido" })} />
                {errors.valor ? <p className="text-sm text-rose-600">{errors.valor.message}</p> : null}
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Usuario que carga</label>
                <div className="rounded-lg border border-secondary-dark/50 bg-slate-100 px-2 py-1.5 text-sm text-slate-600">{user.lastName}, {user.name}</div>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Observación</label>
                <textarea rows={4} className={`${inputBaseClassName} py-2`} placeholder="Observación opcional" {...register("observacion")} />
              </div>
            </div>
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <Link to="/rx" className="inline-flex items-center justify-center rounded-xl border border-secondary-dark/60 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-secondary/40">Cancelar</Link>
          <button type="submit" disabled={createRxMutation.isPending || !canShowFormSections} className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-slate-300">Guardar RX</button>
        </div>
      </form>
    </>
  );
}
