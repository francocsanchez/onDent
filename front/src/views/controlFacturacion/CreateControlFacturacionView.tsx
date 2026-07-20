import {
  createControlFacturacion,
  getCodigosByObraSocialForControlFacturacion,
  getControlFacturacion,
  getPacienteByDNIForControlFacturacion,
} from "@/api/controlFacturacionAPI";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useAuth } from "@/hooks/useAuth";
import type { Codigo, ControlFacturacion, ControlFacturacionCara, Paciente } from "@/types/index";
import { controlFacturacionCaraOptions, controlFacturacionMonthOptions, controlFacturacionPiezaOptions } from "@/utils/controlFacturacion";
import { getCurrentMonthYearLocal } from "@/utils/date";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";

type SearchStatus = "idle" | "found" | "not-found";

type ControlFacturacionFormItem = {
  codigo: string;
  pieza: string;
  cara: ControlFacturacionCara | "";
};

type CreateControlFacturacionFormValues = {
  periodoMes: string;
  periodoAnio: string;
  patientSearchDni: string;
  patientId: string;
  items: ControlFacturacionFormItem[];
};

const { month: currentMonth, year: currentYear } = getCurrentMonthYearLocal();

const inputClassName =
  "w-full rounded-xl border border-[color:var(--cf-border)] bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[color:var(--cf-accent)] focus:ring-2 focus:ring-[color:var(--cf-ring)]";

const compactSelectClassName =
  "h-10 w-full rounded-lg border border-[color:var(--cf-border)] bg-white px-2.5 text-sm text-slate-900 outline-none transition focus:border-[color:var(--cf-accent)] focus:ring-2 focus:ring-[color:var(--cf-ring)]";

const compactActionClassName =
  "inline-flex items-center justify-center rounded-xl border border-[color:var(--cf-border)] bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-[color:var(--cf-accent)] hover:bg-[color:var(--cf-soft)] hover:text-[color:var(--cf-ink)]";

const createEmptyItem = (): ControlFacturacionFormItem => ({
  codigo: "",
  pieza: "",
  cara: "",
});

const initialValues: CreateControlFacturacionFormValues = {
  periodoMes: String(currentMonth).padStart(2, "0"),
  periodoAnio: String(currentYear),
  patientSearchDni: "",
  patientId: "",
  items: [],
};

const shortMonthLabelFormatter = new Intl.DateTimeFormat("es-AR", {
  month: "short",
  year: "2-digit",
});

const formatPeriodoLabel = (month: number, year: number) =>
  shortMonthLabelFormatter
    .format(new Date(year, month - 1, 1))
    .replace(".", "")
    .toLowerCase();

export default function CreateControlFacturacionView() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [foundPatient, setFoundPatient] = useState<Paciente | null>(null);
  const [availableCodes, setAvailableCodes] = useState<Codigo[]>([]);
  const [searchStatus, setSearchStatus] = useState<SearchStatus>("idle");

  const {
    control,
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    formState: { errors },
  } = useForm<CreateControlFacturacionFormValues>({
    defaultValues: initialValues,
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "items",
  });

  const watchedItems = watch("items");
  const canShowFormSections = foundPatient !== null;

  const {
    data: patientHistoryResponse,
    isLoading: isPatientHistoryLoading,
    isError: isPatientHistoryError,
  } = useQuery({
    queryKey: ["control-facturacion", "historial-paciente", foundPatient?._id],
    queryFn: () =>
      getControlFacturacion({
        page: 1,
        patient: foundPatient!._id,
      }),
    enabled: !!foundPatient?._id,
  });

  const patientHistoryRows = useMemo(
    () =>
      (patientHistoryResponse?.data ?? []).flatMap((registro: ControlFacturacion) =>
        registro.items.map((item, index) => ({
          id: `${registro._id}-${item.codigo._id}-${index}`,
          periodo: formatPeriodoLabel(registro.periodoMes, registro.periodoAnio),
          obraSocial: registro.obraSocial.name,
          paciente: `${registro.paciente.lastName} ${registro.paciente.name}`,
          codigo: item.codigo.code,
          pieza: item.pieza || "",
          cara: item.cara || "",
        })),
      ),
    [patientHistoryResponse?.data],
  );

  const resetDetails = () => {
    setValue("patientId", "");
    setAvailableCodes([]);
    replace([]);
  };

  const handlePatientFound = (patient: Paciente) => {
    setFoundPatient(patient);
    setSearchStatus("found");
    setValue("patientId", patient._id);
    setValue("patientSearchDni", String(patient.dni));
    searchCodesMutation.mutate(patient.obraSocial._id);
  };

  const searchCodesMutation = useMutation({
    mutationFn: getCodigosByObraSocialForControlFacturacion,
    onSuccess: (codes) => {
      setAvailableCodes(codes);

      if (codes.length === 0) {
        replace([]);
        return;
      }

      if (getValues("items").length === 0) {
        append(createEmptyItem());
      }
    },
    onError: (error: Error) => {
      setAvailableCodes([]);
      replace([]);
      toast.error(error.message);
    },
  });

  const searchPatientMutation = useMutation({
    mutationFn: getPacienteByDNIForControlFacturacion,
    onSuccess: handlePatientFound,
    onError: () => {
      setFoundPatient(null);
      setSearchStatus("not-found");
      resetDetails();
    },
  });

  const createControlFacturacionMutation = useMutation({
    mutationFn: createControlFacturacion,
    onSuccess: (response: { message: string }) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["control-facturacion", "listar"] });
      queryClient.invalidateQueries({ queryKey: ["control-facturacion", "historial-paciente", foundPatient?._id] });
      navigate("/control-facturacion");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const performPatientSearch = () => {
    const normalizedDni = getValues("patientSearchDni").trim();

    if (!normalizedDni || !/^\d{7,}$/.test(normalizedDni)) {
      setFoundPatient(null);
      setSearchStatus("idle");
      resetDetails();
      return;
    }

    setSearchStatus("idle");
    searchPatientMutation.mutate(normalizedDni);
  };

  const onSubmit = (formData: CreateControlFacturacionFormValues) => {
    if (!foundPatient || !user) {
      return;
    }

    if (availableCodes.length === 0) {
      toast.error("La obra social del paciente no tiene códigos habilitados");
      return;
    }

    createControlFacturacionMutation.mutate({
      periodoMes: Number(formData.periodoMes),
      periodoAnio: Number(formData.periodoAnio),
      paciente: foundPatient._id,
      obraSocial: foundPatient.obraSocial._id,
      usuario: user._id,
      items: formData.items.map((item) => ({
        codigo: item.codigo,
        ...(item.pieza ? { pieza: item.pieza } : {}),
        ...(item.cara ? { cara: item.cara } : {}),
      })),
    });
  };

  if (isLoading) {
    return <LoadingSpinner label="Cargando usuario..." />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div
      className="space-y-4"
      style={
        {
          "--cf-paper": "#f7fbfa",
          "--cf-soft": "#e4f3ef",
          "--cf-accent": "#0f8b7c",
          "--cf-ink": "#16443f",
          "--cf-border": "#b8d5cf",
          "--cf-ring": "rgba(15,139,124,0.18)",
        } as React.CSSProperties
      }
    >
      <div className="mb-2 flex flex-col gap-4 border-b border-secondary-dark/60 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--cf-accent)]">Control facturación</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Carga rápida por paciente</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Diseñado para resolver una facturación completa en una sola pantalla: buscás el DNI, elegís los códigos y guardás.
          </p>
        </div>

        <Link to="/control-facturacion" className={compactActionClassName}>
          Ver listado
        </Link>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <section className="overflow-hidden rounded-[1.6rem] border border-[color:var(--cf-border)] bg-[color:var(--cf-paper)] shadow-[0_24px_60px_-48px_rgba(15,139,124,0.45)]">
          <div className="border-b border-[color:var(--cf-border)] bg-[linear-gradient(180deg,rgba(15,139,124,0.1),rgba(255,255,255,0.72))] p-4">
            <div className="grid gap-3 xl:grid-cols-[170px_150px_minmax(0,280px)_minmax(280px,1fr)] xl:items-start">
              <label className="space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mes</span>
                <select className={inputClassName} {...register("periodoMes", { required: "El mes es obligatorio" })}>
                  {controlFacturacionMonthOptions.map((monthOption) => (
                    <option key={monthOption.value} value={monthOption.value}>
                      {monthOption.label}
                    </option>
                  ))}
                </select>
                {errors.periodoMes ? <p className="text-sm text-rose-600">{errors.periodoMes.message}</p> : null}
              </label>

              <label className="space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Año</span>
                <input
                  type="number"
                  min={2000}
                  max={9999}
                  className={inputClassName}
                  {...register("periodoAnio", {
                    required: "El año es obligatorio",
                    validate: (value) => /^\d{4}$/.test(value) || "Ingresá un año válido",
                  })}
                />
                {errors.periodoAnio ? <p className="text-sm text-rose-600">{errors.periodoAnio.message}</p> : null}
              </label>

              <div className="rounded-[1.1rem] border border-[color:var(--cf-border)] bg-white p-3">
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">DNI del paciente</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="Ej: 31245780"
                      className={inputClassName}
                      {...register("patientSearchDni", {
                        setValueAs: (value: string) => value.replace(/\D/g, ""),
                        onChange: () => {
                          if (foundPatient || searchStatus !== "idle") {
                            setFoundPatient(null);
                            setSearchStatus("idle");
                            resetDetails();
                          }
                        },
                      })}
                    />
                    <button
                      type="button"
                      onClick={performPatientSearch}
                      disabled={searchPatientMutation.isPending || searchCodesMutation.isPending}
                      className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[color:var(--cf-accent)] text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:bg-slate-300"
                      aria-label="Buscar paciente"
                      title="Buscar paciente"
                    >
                      <Search className={`h-4 w-4 ${searchPatientMutation.isPending || searchCodesMutation.isPending ? "animate-pulse" : ""}`} />
                    </button>
                  </div>
                </label>
              </div>

              <div className="rounded-[1.1rem] border border-[color:var(--cf-border)] bg-white p-3">
                {searchStatus === "found" && foundPatient ? (
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="inline-flex rounded-full bg-[color:var(--cf-soft)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--cf-accent)]">
                        Paciente validado
                      </div>
                      <p className="mt-2 text-base font-semibold text-slate-900">
                        {foundPatient.lastName}, {foundPatient.name}
                      </p>
                      <p className="text-sm text-slate-600">DNI {String(foundPatient.dni)} · {foundPatient.obraSocial.name}</p>
                    </div>
                    <div className="rounded-lg bg-[color:var(--cf-paper)] px-3 py-2 text-sm text-slate-700">
                      {isPatientHistoryLoading
                        ? "Buscando historial..."
                        : `${patientHistoryRows.length} fila${patientHistoryRows.length === 1 ? "" : "s"} en historial`}
                    </div>
                  </div>
                ) : null}

                {searchStatus === "not-found" ? (
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-rose-700">Paciente inexistente</p>
                      <p className="text-sm text-rose-600">No encontramos un paciente con ese DNI.</p>
                    </div>
                    <Link
                      to="/pacientes/create"
                      className="inline-flex items-center justify-center rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                    >
                      Crear paciente
                    </Link>
                  </div>
                ) : null}

                {searchStatus === "idle" ? (
                  <p className="text-sm leading-6 text-slate-500">Buscá un DNI para abrir la planilla y ver el historial del paciente.</p>
                ) : null}
              </div>
            </div>
          </div>

          <section className={`p-4 ${canShowFormSections ? "opacity-100" : "pointer-events-none opacity-55"}`}>
              <div className="flex flex-col gap-3 border-b border-[color:var(--cf-border)] pb-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--cf-accent)]">Planilla</p>
                  <h3 className="mt-1 text-lg font-semibold text-[color:var(--cf-ink)]">Carga de códigos</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    `Pieza` y `cara` quedan opcionales. La grilla está pensada para cargar rápido y seguir.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {fields.length} fila{fields.length === 1 ? "" : "s"}
                  </div>
                  <button
                    type="button"
                    onClick={() => append(createEmptyItem())}
                    disabled={!canShowFormSections || availableCodes.length === 0}
                    className="inline-flex items-center gap-2 rounded-xl bg-[color:var(--cf-accent)] px-3 py-2 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    <Plus className="h-4 w-4" />
                    Agregar fila
                  </button>
                </div>
              </div>

              <div className="mt-4">
                {!canShowFormSections ? (
                  <div className="rounded-[1.2rem] border border-dashed border-[color:var(--cf-border)] bg-white px-4 py-10 text-center text-sm text-slate-500">
                    Primero validá un paciente para habilitar la planilla.
                  </div>
                ) : null}

                {canShowFormSections && availableCodes.length === 0 ? (
                  <div className="rounded-[1.2rem] border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
                    La obra social del paciente no tiene códigos habilitados para cargar.
                  </div>
                ) : null}

                {canShowFormSections && availableCodes.length > 0 ? (
                  <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                    <div className="overflow-hidden rounded-[1.35rem] border border-[color:var(--cf-border)] bg-white">
                      <div className="grid grid-cols-[minmax(0,1.6fr)_120px_140px_54px] gap-0 border-b border-[color:var(--cf-border)] bg-[color:var(--cf-paper)] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                        <span>Código</span>
                        <span>Pieza</span>
                        <span>Cara</span>
                        <span className="text-center">Quitar</span>
                      </div>

                      {fields.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-slate-500">Agregá la primera fila para empezar a cargar.</div>
                      ) : null}

                      <div className="divide-y divide-[color:var(--cf-border)]">
                        {fields.map((field, index) => {
                          const selectedCodeId = watchedItems?.[index]?.codigo ?? "";
                          const selectedCode = availableCodes.find((code) => code._id === selectedCodeId) ?? null;

                          return (
                            <div key={field.id} className="grid grid-cols-1 gap-2 px-3 py-3 md:grid-cols-[minmax(0,1.6fr)_120px_140px_54px] md:items-start">
                              <div>
                                <select
                                  className={compactSelectClassName}
                                  {...register(`items.${index}.codigo`, {
                                    required: "Seleccioná un código",
                                  })}
                                >
                                  <option value="">Seleccionar código</option>
                                  {availableCodes.map((code) => (
                                    <option key={code._id} value={code._id}>
                                      {code.code} - {code.description}
                                    </option>
                                  ))}
                                </select>
                                <div className="mt-1 min-h-[18px] text-xs text-slate-500">
                                  {errors.items?.[index]?.codigo ? (
                                    <span className="text-rose-600">{errors.items[index]?.codigo?.message}</span>
                                  ) : selectedCode ? (
                                    <span>
                                      {selectedCode.code} · {selectedCode.description}
                                    </span>
                                  ) : (
                                    <span>Elegí el código de la obra social.</span>
                                  )}
                                </div>
                              </div>

                              <div>
                                <select className={compactSelectClassName} {...register(`items.${index}.pieza`)}>
                                  <option value="">Sin pieza</option>
                                  {controlFacturacionPiezaOptions.map((pieza) => (
                                    <option key={pieza} value={pieza}>
                                      {pieza}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <select
                                  className={compactSelectClassName}
                                  {...register(`items.${index}.cara`, {
                                    setValueAs: (value: string) => (value === "vestivular" ? "Vestibular" : value),
                                  })}
                                >
                                  <option value="">Sin cara</option>
                                  {controlFacturacionCaraOptions.map((cara) => (
                                    <option key={cara} value={cara}>
                                      {cara}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="flex justify-end md:justify-center">
                                <button
                                  type="button"
                                  onClick={() => remove(index)}
                                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-700 transition hover:bg-rose-100"
                                  aria-label={`Eliminar fila ${index + 1}`}
                                  title="Eliminar fila"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-[1.35rem] border border-[color:var(--cf-border)] bg-white">
                      <div className="border-b border-[color:var(--cf-border)] bg-[color:var(--cf-paper)] px-3 py-2">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Historial del paciente</p>
                        <p className="mt-1 text-sm text-slate-600">Vista rápida de lo ya cargado, similar a tu control en Excel.</p>
                      </div>

                      {isPatientHistoryLoading ? (
                        <div className="px-4 py-8 text-center text-sm text-slate-500">Cargando historial del paciente...</div>
                      ) : isPatientHistoryError ? (
                        <div className="px-4 py-8 text-center text-sm text-rose-600">No pudimos cargar el historial del paciente.</div>
                      ) : patientHistoryRows.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-slate-500">Todavía no hay historial cargado para este paciente.</div>
                      ) : (
                        <div className="max-h-[420px] overflow-auto">
                          <table className="min-w-full text-sm">
                            <thead className="sticky top-0 bg-[color:var(--cf-paper)]">
                              <tr className="border-b border-[color:var(--cf-border)] text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                                <th className="px-3 py-2 text-left">Mes</th>
                                <th className="px-3 py-2 text-left">Código</th>
                                <th className="px-3 py-2 text-left">Pieza</th>
                                <th className="px-3 py-2 text-left">Cara</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[color:var(--cf-border)]">
                              {patientHistoryRows.map((row) => (
                                <tr key={row.id} className="odd:bg-white even:bg-slate-50/70">
                                  <td className="whitespace-nowrap px-3 py-2 font-medium text-slate-700">{row.periodo}</td>
                                  <td className="whitespace-nowrap px-3 py-2 text-slate-900">{row.codigo}</td>
                                  <td className="whitespace-nowrap px-3 py-2 text-slate-700">{row.pieza || "-"}</td>
                                  <td className="whitespace-nowrap px-3 py-2 text-slate-700">{row.cara || "-"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </section>
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={createControlFacturacionMutation.isPending || !canShowFormSections || availableCodes.length === 0 || fields.length === 0}
            className="inline-flex items-center justify-center rounded-2xl bg-[color:var(--cf-ink)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[color:var(--cf-accent)] disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {createControlFacturacionMutation.isPending ? "Guardando..." : "Guardar carga"}
          </button>
        </div>
      </form>
    </div>
  );
}
