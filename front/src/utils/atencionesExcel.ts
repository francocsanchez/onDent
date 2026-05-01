import type { Atencion } from "../types";

const formatFecha = (fecha: string) =>
  new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(fecha));

type ExportFilters = {
  year?: string;
  month?: string;
};

export async function exportAtencionesToExcel(atenciones: Atencion[], filters: ExportFilters = {}) {
  const XLSX = await import("xlsx");
  const rows = atenciones.flatMap((atencion) =>
    atencion.codigos.map((codigo) => ({
      Fecha: formatFecha(atencion.fecha),
      Año: atencion.fecha.slice(0, 4),
      Mes: atencion.fecha.slice(5, 7),
      Usuario: `${atencion.usuario.lastName}, ${atencion.usuario.name}`,
      Paciente: `${atencion.paciente.lastName} ${atencion.paciente.name}`,
      DNI: atencion.paciente.dni,
      "Obra social": atencion.obraSocial.name,
      Código: codigo.codigo.code,
      Descripción: codigo.codigo.description,
      Pieza: codigo.pieza || "",
      Estado: codigo.status,
      Valor: codigo.valor,
      "Observaciones código": codigo.observaciones || "",
      "Observaciones atención": atencion.observaciones || "",
      Coseguro: atencion.coseguro ?? 0,
      "Coseguro odonto": atencion.coseguroOdonto ?? 0,
    })),
  );

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet["!cols"] = [
    { wch: 12 },
    { wch: 8 },
    { wch: 8 },
    { wch: 24 },
    { wch: 24 },
    { wch: 12 },
    { wch: 22 },
    { wch: 12 },
    { wch: 40 },
    { wch: 10 },
    { wch: 14 },
    { wch: 12 },
    { wch: 28 },
    { wch: 28 },
    { wch: 12 },
    { wch: 16 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Atenciones");

  const yearSuffix = filters.year ?? "todos";
  const monthSuffix = filters.month ?? "todos";
  XLSX.writeFileXLSX(workbook, `atenciones_${yearSuffix}_${monthSuffix}.xlsx`);
}
