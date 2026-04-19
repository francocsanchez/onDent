type AtencionDashItem = {
  fecha?: string | Date;
  createdAt?: string | Date;
  coseguroOdonto?: number;
  codigos?: {
    valor?: number;
    status?: "OK" | "Pendiente" | "Denegado" | "Diferido" | "No cargado";
  }[];
};

type AtencionesPorDiaItem = {
  fecha: string;
  dia: number;
  cantidad: number;
};

type AtencionesPorMesItem = {
  periodo: string;
  anio: number;
  mes: number;
  cantidad: number;
};

type ResumenMensualAtencionesItem = {
  periodo: string;
  anio: number;
  mes: number;
  cantidad: number;
  montoAtencion: number;
  montoCoseguro: number;
  montoTotal: number;
  ok: number;
  pendiente: number;
  denegado: number;
  diferido: number;
  noCargado: number;
};

type AtencionesDashReport = {
  atencionesPorDiaMesActual: AtencionesPorDiaItem[];
  atencionesPorMes: AtencionesPorMesItem[];
  resumenMensual: ResumenMensualAtencionesItem[];
};

const toDate = (value?: string | Date) => {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export function reporteAtencionesDash(atenciones: AtencionDashItem[]): AtencionesDashReport {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const atencionesPorDiaMesActualMap = new Map<number, number>();
  const resumenMensualMap = new Map<string, ResumenMensualAtencionesItem>();

  for (let day = 1; day <= daysInCurrentMonth; day += 1) {
    atencionesPorDiaMesActualMap.set(day, 0);
  }

  atenciones.forEach((atencion) => {
    const atencionDate = toDate(atencion.fecha) ?? toDate(atencion.createdAt);
    if (!atencionDate) return;

    const year = atencionDate.getFullYear();
    const month = atencionDate.getMonth();
    const day = atencionDate.getDate();

    const monthlyKey = `${year}-${String(month + 1).padStart(2, "0")}`;
    const resumenMensualActual = resumenMensualMap.get(monthlyKey) ?? {
      periodo: monthlyKey,
      anio: year,
      mes: month + 1,
      cantidad: 0,
      montoAtencion: 0,
      montoCoseguro: 0,
      montoTotal: 0,
      ok: 0,
      pendiente: 0,
      denegado: 0,
      diferido: 0,
      noCargado: 0,
    };

    const montoAtencion = (atencion.codigos ?? []).reduce((total, codigo) => total + (codigo.valor ?? 0), 0);
    const montoCoseguro = atencion.coseguroOdonto ?? 0;

    resumenMensualActual.cantidad += 1;
    resumenMensualActual.montoAtencion += montoAtencion;
    resumenMensualActual.montoCoseguro += montoCoseguro;
    resumenMensualActual.montoTotal = resumenMensualActual.montoAtencion + resumenMensualActual.montoCoseguro;

    (atencion.codigos ?? []).forEach((codigo) => {
      if (codigo.status === "OK") resumenMensualActual.ok += 1;
      if (codigo.status === "Pendiente") resumenMensualActual.pendiente += 1;
      if (codigo.status === "Denegado") resumenMensualActual.denegado += 1;
      if (codigo.status === "Diferido") resumenMensualActual.diferido += 1;
      if (codigo.status === "No cargado") resumenMensualActual.noCargado += 1;
    });

    resumenMensualMap.set(monthlyKey, resumenMensualActual);

    if (year === currentYear && month === currentMonth) {
      atencionesPorDiaMesActualMap.set(day, (atencionesPorDiaMesActualMap.get(day) ?? 0) + 1);
    }
  });

  const atencionesPorDiaMesActual = Array.from(atencionesPorDiaMesActualMap.entries()).map(([day, cantidad]) => ({
    fecha: `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    dia: day,
    cantidad,
  }));

  const resumenMensual = Array.from(resumenMensualMap.values()).sort((a, b) => b.periodo.localeCompare(a.periodo));

  const atencionesPorMes = resumenMensual.map(({ periodo, anio, mes, cantidad }) => ({
    periodo,
    anio,
    mes,
    cantidad,
  }));

  return {
    atencionesPorDiaMesActual,
    atencionesPorMes,
    resumenMensual,
  };
}
