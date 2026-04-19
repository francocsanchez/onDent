import { createAtencion, getCodigosByObraSocial, getPacienteByDNI } from "@/api/atencioneAPI";
import type { Codigo, Paciente } from "@/types/index";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Search } from "lucide-react";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

type MockUser = {
  _id: string;
  name: string;
  lastName: string;
};

type AtencionStatus = "OK" | "Pendiente" | "Denegado" | "Diferido";

type LocalAtencionCodigoPayload = {
  codigo: string;
  pieza: string;
  valor: number;
  status: AtencionStatus;
  observaciones?: string;
};

type LocalAtencionPayload = {
  fecha: string;
  paciente: string;
  usuario: string;
  obraSocial: string;
  codigos: LocalAtencionCodigoPayload[];
  observaciones?: string;
  coseguro?: number;
  coseguroOdonto?: number;
};

type AttentionCodeFormItem = {
  dentalCodeId: string;
  piece: string;
  observation: string;
};

type CreateAtencionFormValues = {
  fecha: string;
  patientSearchDni: string;
  patientId: string;
  codes: AttentionCodeFormItem[];
  generalObservation: string;
  coseguro: number | "";
};

type SearchStatus = "idle" | "found" | "not-found";

const mockCurrentUser: MockUser = {
  _id: "69dc1f26ddefc14594024112",
  name: "Agustin",
  lastName: "Bobadilla",
};

const createEmptyCodeRow = (): AttentionCodeFormItem => ({
  dentalCodeId: "",
  piece: "",
  observation: "",
});

const inputBaseClassName =
  "w-full rounded-xl border border-secondary-dark/60 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20";

const disabledInputClassName = "w-full rounded-xl border border-secondary-dark/50 bg-slate-100 px-3 py-2.5 text-sm text-slate-500 outline-none";

const getTodayDate = () => new Date().toISOString().slice(0, 10);

export default function CreateAtencionView() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [foundPatient, setFoundPatient] = useState<Paciente | null>(null);
  const [availableCodes, setAvailableCodes] = useState<Codigo[]>([]);
  const [searchStatus, setSearchStatus] = useState<SearchStatus>("idle");

  const initialValues: CreateAtencionFormValues = {
    fecha: getTodayDate(),
    patientSearchDni: "",
    patientId: "",
    codes: [],
    generalObservation: "",
    coseguro: "",
  };

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<CreateAtencionFormValues>({
    defaultValues: initialValues,
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "codes",
  });

  const watchedCodes = watch("codes");
  const watchedCoseguro = watch("coseguro");
  const canShowFormSections = foundPatient !== null;

  const resetAttentionDetails = () => {
    setAvailableCodes([]);
    setValue("patientId", "");
    replace([]);
    setValue("generalObservation", "");
    setValue("coseguro", "");
  };

  const searchCodesMutation = useMutation({
    mutationFn: getCodigosByObraSocial,
    onSuccess: (codes) => {
      setAvailableCodes(codes);

      if (getValues("codes").length === 0) {
        append(createEmptyCodeRow());
      }
    },
    onError: () => {
      setAvailableCodes([]);
      replace([]);
    },
  });

  const searchPatientMutation = useMutation({
    mutationFn: getPacienteByDNI,
    onSuccess: (patient) => {
      setFoundPatient(patient);
      setSearchStatus("found");
      setValue("patientId", patient._id);
      searchCodesMutation.mutate(patient.obraSocial._id);
    },
    onError: () => {
      setFoundPatient(null);
      setSearchStatus("not-found");
      resetAttentionDetails();
    },
  });

  const createAtencionMutation = useMutation({
    mutationFn: createAtencion,
    onSuccess: (response: { message: string }) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["atenciones", "listar"] });
      navigate("/atenciones");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const performPatientSearch = (dniToSearch?: string) => {
    const normalizedDni = (dniToSearch ?? getValues("patientSearchDni")).trim();

    if (!normalizedDni) {
      setFoundPatient(null);
      setSearchStatus("idle");
      resetAttentionDetails();
      return;
    }

    if (!/^\d+$/.test(normalizedDni) || normalizedDni.length < 7) {
      setFoundPatient(null);
      setSearchStatus("idle");
      resetAttentionDetails();
      return;
    }

    setSearchStatus("idle");
    searchPatientMutation.mutate(normalizedDni);
  };

  const onSubmit = (formData: CreateAtencionFormValues) => {
    if (!foundPatient) {
      return;
    }

    const attentionPayload: LocalAtencionPayload = {
      fecha: formData.fecha,
      paciente: foundPatient._id,
      usuario: mockCurrentUser._id,
      obraSocial: foundPatient.obraSocial._id,
      codigos: formData.codes.map((item) => ({
        codigo: item.dentalCodeId,
        pieza: item.piece.trim(),
        valor: 0,
        status: "Pendiente",
        observaciones: item.observation.trim() || undefined,
      })),
      observaciones: formData.generalObservation.trim() || undefined,
      coseguro: formData.coseguro === "" ? 0 : formData.coseguro,
      coseguroOdonto: 0,
    };

    createAtencionMutation.mutate(attentionPayload);
  };

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 border-b border-secondary-dark/60 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Atenciones odontologicas</p>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Registrar nueva atencion</h2>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <section className="overflow-hidden rounded-[1.35rem] border border-secondary-dark/60 bg-white shadow-sm">
          <div className="border-b border-secondary-dark/50 bg-gradient-to-r from-secondary/50 via-white to-white px-5 py-4">
            <p className="text-sm font-medium text-primary">Paso 1</p>
            <h3 className="text-base font-semibold text-slate-900">Busqueda de paciente</h3>
            <p className="mt-0.5 text-sm text-slate-500">Ingresá el DNI para validar si el paciente ya existe en el sistema.</p>
          </div>

          <div className="grid gap-4 px-5 py-5 lg:grid-cols-[220px_minmax(0,1fr)_auto] lg:items-end">
            <div className="space-y-2">
              <label htmlFor="fecha" className="text-sm font-medium text-slate-700">
                Fecha de atencion
              </label>
              <div className="relative">
                <input
                  id="fecha"
                  type="date"
                  className={`${inputBaseClassName} pr-10`}
                  {...register("fecha", {
                    required: "La fecha es obligatoria",
                  })}
                />
                <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
              {errors.fecha ? <p className="text-sm text-rose-600">{errors.fecha.message}</p> : null}
            </div>

            <div className="space-y-2">
              <label htmlFor="patientSearchDni" className="text-sm font-medium text-slate-700">
                DNI del paciente
              </label>
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
                      resetAttentionDetails();
                    }
                  },
                })}
              />
            </div>

            <button
              type="button"
              onClick={() => performPatientSearch()}
              disabled={searchPatientMutation.isPending || searchCodesMutation.isPending}
              className="inline-flex h-[46px] w-[46px] items-center justify-center rounded-xl bg-primary text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-slate-300"
              aria-label="Buscar paciente"
              title="Buscar paciente"
            >
              <Search className={`h-4 w-4 ${searchPatientMutation.isPending || searchCodesMutation.isPending ? "animate-pulse" : ""}`} />
            </button>
          </div>

          {searchStatus === "found" && foundPatient ? (
            <div className="border-t border-emerald-100 bg-emerald-50/70 px-5 py-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-emerald-700">Paciente encontrado</p>
                  <p className="text-sm text-emerald-600">Podés continuar con la carga de la atención.</p>
                </div>
                <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                  Validado
                </span>
              </div>

              <div className="mt-3 rounded-xl border border-emerald-100 bg-white px-4 py-3">
                <div className="flex flex-col gap-2 text-sm text-slate-700 md:flex-row md:items-center md:gap-4">
                  <span className="font-semibold text-slate-900">
                    {foundPatient.lastName}, {foundPatient.name}
                  </span>
                  <span className="hidden text-slate-300 md:inline">|</span>
                  <span>
                    <span className="font-medium text-slate-500">DNI:</span> {String(foundPatient.dni)}
                  </span>
                  <span className="hidden text-slate-300 md:inline">|</span>
                  <span>
                    <span className="font-medium text-slate-500">Obra social:</span> {foundPatient.obraSocial.name}
                  </span>
                </div>
              </div>
            </div>
          ) : null}

          {searchStatus === "not-found" ? (
            <div className="border-t border-rose-100 bg-rose-50/70 px-5 py-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-rose-700">Paciente inexistente</p>
                  <p className="text-sm text-rose-600">No encontramos un paciente con ese DNI.</p>
                </div>

                <Link
                  to="/pacientes/create"
                  className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                >
                  Crear paciente
                </Link>
              </div>
            </div>
          ) : null}
        </section>

        <section
          className={`overflow-hidden rounded-[1.35rem] border border-secondary-dark/60 bg-white shadow-sm transition ${
            canShowFormSections ? "opacity-100" : "pointer-events-none opacity-60"
          }`}
        >
          <div className="border-b border-secondary-dark/50 bg-gradient-to-r from-slate-50 via-white to-white px-5 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-primary">Paso 2</p>
                <h3 className="text-base font-semibold text-slate-900">Codigos de atencion</h3>
                <p className="mt-0.5 text-sm text-slate-500">Agregá uno o varios codigos odontologicos para esta atencion.</p>
              </div>

              <button
                type="button"
                onClick={() => append(createEmptyCodeRow())}
                disabled={!canShowFormSections}
                className="inline-flex items-center justify-center rounded-xl border border-secondary-dark/60 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-primary/40 hover:bg-secondary/40 hover:text-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                Agregar codigo
              </button>
            </div>
          </div>

          <div className="space-y-3 px-5 py-5">
            {!canShowFormSections ? (
              <div className="rounded-2xl border border-dashed border-secondary-dark/60 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                Primero buscá y validá un paciente para habilitar la carga de codigos.
              </div>
            ) : null}

            {canShowFormSections && fields.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-secondary-dark/60 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                Aun no agregaste codigos. Usá el boton <span className="font-semibold text-slate-700">Agregar codigo</span> para comenzar.
              </div>
            ) : null}

            {fields.map((field, index) => {
              const selectedCodeId = watchedCodes?.[index]?.dentalCodeId ?? "";
              const selectedCode = availableCodes.find((dentalCode) => dentalCode._id === selectedCodeId) ?? null;

              return (
                <div key={field.id} className="rounded-[1.1rem] border border-secondary-dark/50 bg-slate-50/70 p-3.5">
                  <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Codigo #{index + 1}</p>
                      <p className="text-sm text-slate-500">Seleccioná el codigo y completá la pieza.</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-sm font-medium text-rose-700 transition hover:bg-rose-50"
                    >
                      Eliminar
                    </button>
                  </div>

                  <div className="grid gap-3 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
                    <div className="space-y-2">
                      <label htmlFor={`codes.${index}.dentalCodeId`} className="text-sm font-medium text-slate-700">
                        Codigo odontologico
                      </label>
                      <select
                        id={`codes.${index}.dentalCodeId`}
                        className={inputBaseClassName}
                        {...register(`codes.${index}.dentalCodeId`, {
                          required: "Seleccioná un codigo",
                        })}
                      >
                        <option value="">Seleccionar codigo</option>
                        {availableCodes.map((dentalCode) => (
                          <option key={dentalCode._id} value={dentalCode._id}>
                            {dentalCode.code} - {dentalCode.description}
                          </option>
                        ))}
                      </select>
                      {errors.codes?.[index]?.dentalCodeId ? (
                        <p className="text-sm text-rose-600">{errors.codes[index]?.dentalCodeId?.message}</p>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Detalle automatico</label>
                      <div className="rounded-xl border border-secondary-dark/50 bg-white px-3 py-2">
                        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">{selectedCode?.code ?? "Sin codigo"}</p>
                        <p className="mt-0.5 text-sm text-slate-700">
                          {selectedCode?.description ?? "Seleccioná un codigo para ver su descripcion."}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-[160px_minmax(0,1fr)]">
                    <div className="space-y-2">
                      <label htmlFor={`codes.${index}.piece`} className="text-sm font-medium text-slate-700">
                        Pieza
                      </label>
                      <input
                        id={`codes.${index}.piece`}
                        type="text"
                        placeholder="Ej: 16"
                        className={inputBaseClassName}
                        {...register(`codes.${index}.piece`)}
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor={`codes.${index}.observation`} className="text-sm font-medium text-slate-700">
                        Observacion del codigo
                      </label>
                      <input
                        id={`codes.${index}.observation`}
                        type="text"
                        placeholder="Opcional"
                        className={inputBaseClassName}
                        {...register(`codes.${index}.observation`)}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section
          className={`overflow-hidden rounded-[1.35rem] border border-secondary-dark/60 bg-white shadow-sm transition ${
            canShowFormSections ? "opacity-100" : "pointer-events-none opacity-60"
          }`}
        >
          <div className="border-b border-secondary-dark/50 bg-gradient-to-r from-slate-50 via-white to-white px-5 py-4">
            <p className="text-sm font-medium text-primary">Paso 3</p>
            <h3 className="text-base font-semibold text-slate-900">Datos finales de la atencion</h3>
            <p className="mt-0.5 text-sm text-slate-500">Completá la observacion general y el coseguro antes de guardar.</p>
          </div>

          <div className="grid gap-4 px-5 py-5 lg:grid-cols-[minmax(0,1fr)_240px]">
            <div className="space-y-2">
              <label htmlFor="generalObservation" className="text-sm font-medium text-slate-700">
                Observacion general
              </label>
              <textarea
                id="generalObservation"
                rows={4}
                placeholder="Detalle general de la atencion, indicaciones o notas relevantes."
                className={`${inputBaseClassName} resize-none`}
                {...register("generalObservation")}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="coseguro" className="text-sm font-medium text-slate-700">
                Coseguro
              </label>
              <input
                id="coseguro"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                className={inputBaseClassName}
                {...register("coseguro", {
                  setValueAs: (value: string) => {
                    if (value === "") {
                      return "";
                    }

                    const parsedValue = Number(value);
                    return Number.isNaN(parsedValue) ? "" : parsedValue;
                  },
                  validate: (value) => value === "" || value >= 0 || "El coseguro no puede ser negativo",
                })}
              />
              {errors.coseguro ? <p className="text-sm text-rose-600">{errors.coseguro.message}</p> : null}

              <div className="rounded-xl border border-secondary-dark/50 bg-slate-50 p-3.5">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">Resumen</p>
                <p className="mt-2 text-sm text-slate-600">
                  {fields.length} {fields.length === 1 ? "codigo cargado" : "codigos cargados"}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Coseguro actual:{" "}
                  <span className="font-semibold text-slate-900">${typeof watchedCoseguro === "number" ? watchedCoseguro.toFixed(2) : "0.00"}</span>
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[1.35rem] border border-secondary-dark/60 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium text-primary">Acciones</p>
              <h3 className="text-base font-semibold text-slate-900">Confirmar registro</h3>
              <p className="mt-0.5 text-sm text-slate-500">El envio final trabaja en modo local y muestra el resultado en consola.</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to="/atenciones"
                className="inline-flex items-center justify-center rounded-xl border border-secondary-dark/60 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-secondary/40"
              >
                Cancelar
              </Link>

              <button
                type="submit"
                disabled={!canShowFormSections || fields.length === 0 || createAtencionMutation.isPending}
                className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {createAtencionMutation.isPending ? "Guardando..." : "Guardar atencion"}
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">Paciente</p>
              <input
                type="text"
                value={foundPatient ? `${foundPatient.lastName}, ${foundPatient.name}` : "Pendiente de seleccion"}
                readOnly
                className={disabledInputClassName}
              />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">DNI</p>
              <input type="text" value={foundPatient ? String(foundPatient.dni) : "Sin validar"} readOnly className={disabledInputClassName} />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">Obra social</p>
              <input type="text" value={foundPatient?.obraSocial.name ?? "Sin validar"} readOnly className={disabledInputClassName} />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">Profesional</p>
              <input type="text" value={`${mockCurrentUser.lastName}, ${mockCurrentUser.name}`} readOnly className={disabledInputClassName} />
            </div>
          </div>
        </section>
      </form>
    </>
  );
}
