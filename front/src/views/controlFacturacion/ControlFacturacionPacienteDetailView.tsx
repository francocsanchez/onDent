import { getControlFacturacion } from "@/api/controlFacturacionAPI";
import LoadingSpinner from "@/components/LoadingSpinner";
import type { ControlFacturacion } from "@/types/index";
import { controlFacturacionMonthOptions } from "@/utils/controlFacturacion";
import { getCurrentMonthYearLocal } from "@/utils/date";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useMemo } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";

const { month: currentMonth, year: currentYear } = getCurrentMonthYearLocal();

const shortMonthLabelFormatter = new Intl.DateTimeFormat("es-AR", {
  month: "short",
  year: "2-digit",
});

const formatPeriodoLabel = (month: number, year: number) =>
  shortMonthLabelFormatter
    .format(new Date(year, month - 1, 1))
    .replace(".", "")
    .toLowerCase();

export default function ControlFacturacionPacienteDetailView() {
  const { idPaciente } = useParams();
  const [searchParams] = useSearchParams();

  const selectedMonth = useMemo(() => {
    const rawMonth = searchParams.get("month")?.trim() ?? String(currentMonth).padStart(2, "0");
    return controlFacturacionMonthOptions.some((monthOption) => monthOption.value === rawMonth) ? rawMonth : String(currentMonth).padStart(2, "0");
  }, [searchParams]);

  const selectedYear = useMemo(() => {
    const rawYear = searchParams.get("year")?.trim() ?? String(currentYear);
    return /^\d{4}$/.test(rawYear) ? rawYear : String(currentYear);
  }, [searchParams]);

  const backQuery = new URLSearchParams({
    month: selectedMonth,
    year: selectedYear,
  }).toString();

  const {
    data: response,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["control-facturacion", "detalle-paciente-vista", idPaciente, selectedMonth, selectedYear],
    queryFn: () =>
      getControlFacturacion({
        page: 1,
        patient: idPaciente!,
        month: selectedMonth,
        year: selectedYear,
      }),
    enabled: !!idPaciente,
  });

  if (!idPaciente) {
    return <Navigate to="/control-facturacion" replace />;
  }

  if (isLoading) {
    return <LoadingSpinner label="Cargando cargas del paciente..." />;
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
        Ocurrió un error al cargar las cargas del paciente.
      </div>
    );
  }

  const registros = response?.data ?? [];
  const firstRecord = registros[0];
  const patientName = firstRecord ? `${firstRecord.paciente.lastName} ${firstRecord.paciente.name}` : "Paciente";
  const patientDni = firstRecord?.paciente.dni ?? null;
  const obraSocial = firstRecord?.obraSocial.name ?? "-";
  const totalItems = registros.reduce((total, registro) => total + registro.items.length, 0);

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 border-b border-secondary-dark/60 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Control facturación</p>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{patientName}</h2>
          <p className="mt-1 text-sm text-slate-600">
            {patientDni ? `DNI ${patientDni} · ` : ""}
            {obraSocial} · {totalItems} código{totalItems === 1 ? "" : "s"} en {registros.length} carga{registros.length === 1 ? "" : "s"}
          </p>
        </div>

        <Link
          to={`/control-facturacion?${backQuery}`}
          className="inline-flex items-center gap-2 rounded-2xl border border-secondary-dark/60 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-primary/40 hover:bg-secondary/40 hover:text-primary-dark"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al listado
        </Link>
      </div>

      <div className="overflow-hidden rounded-[1.6rem] border border-secondary-dark/60 bg-white shadow-sm">
        {registros.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-slate-500">
            No hay cargas para este paciente en {formatPeriodoLabel(Number(selectedMonth), Number(selectedYear))}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-dark/50">
              <thead className="bg-secondary/40">
                <tr>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Período</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Código</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Descripción</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Pieza</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Cara</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-dark/80">Usuario</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-secondary-dark/40 bg-white">
                {registros.flatMap((registro: ControlFacturacion) =>
                  registro.items.map((item, index) => (
                    <tr key={`${registro._id}-${item.codigo._id}-${index}`} className="odd:bg-white even:bg-slate-50/60">
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-700">
                        {formatPeriodoLabel(registro.periodoMes, registro.periodoAnio)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-900">{item.codigo.code}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{item.codigo.description}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">{item.pieza || "-"}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">{item.cara || "-"}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">
                        {registro.usuario.lastName} {registro.usuario.name}
                      </td>
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
