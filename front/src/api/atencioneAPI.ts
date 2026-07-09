import api from "@/libs/axios";
import { isAxiosError } from "axios";
import { z } from "zod";
import {
  AtencionesTableSchema,
  atencionesAvailableFiltersSchema,
  atencionesDashSchema,
  atencionesGlobalReportSchema,
  atencionesListResponseSchema,
  atencionSchema,
  codigoSchema,
  coseguroItemSchema,
  cosegurosListResponseSchema,
  disponibilidadPrestacionesSchema,
  liquidacionesAvailableFiltersSchema,
  liquidacionesListResponseSchema,
  pagoOdontologoSchema,
  pagosAvailableFiltersSchema,
  pagosCuentaCorrienteResponseSchema,
  pagosPendientesResponseSchema,
  pacienteSchema,
  pacienteAtencionesHistorialResponseSchema,
  type Atencion,
  type AtencionesDash,
  type AtencionesAvailableFilters,
  type AtencionesGlobalReport,
  type Codigo,
  type CoseguroItem,
  type CosegurosListResponse,
  type DisponibilidadPrestaciones,
  type LiquidacionesAvailableFilters,
  type LiquidacionesListResponse,
  type PagoOdontologo,
  type PagosAvailableFilters,
  type PagosCuentaCorrienteResponse,
  type PacienteAtencionesHistorialResponse,
  type PagosPendientesResponse,
  type Paciente,
} from "../types";

type AtencionStatus = "OK" | "Pendiente" | "Denegado" | "Diferido" | "No cargado";

type CreateAtencionPayload = {
  fecha: string;
  paciente: string;
  usuario: string;
  obraSocial: string;
  codigos: {
    codigo: string;
    pieza: string;
    valor: number;
    coseguro?: number;
    status: AtencionStatus;
    observaciones?: string;
  }[];
  observaciones?: string;
  coseguroOdonto?: number;
};

type UpdateAtencionPayload = CreateAtencionPayload & {
  idAtencion: Atencion["_id"];
};

type GetAtencionesFiltradasParams = {
  periodo: string;
  status: AtencionStatus;
  page?: number;
};

type GetAtencionesParams = {
  page?: number;
  year?: string;
  month?: string;
  status?: AtencionStatus;
  obraSocial?: string;
};

type GetDisponibilidadPrestacionesParams = {
  paciente: string;
  obraSocial: string;
  fecha?: string;
};

type GetLiquidacionesParams = {
  page?: number;
  usuario?: string;
  obraSocial?: string;
  status?: AtencionStatus;
  pagoEstado?: "pagado" | "no-pagado";
  month?: string;
  year?: string;
};

type UpdateLiquidacionItemPayload = {
  idAtencion: string;
  codigoId: string;
  rowIndex: number;
  status: AtencionStatus;
  valor: number;
  coseguro: number;
};

type UpdateLiquidacionesBulkPayload = {
  items: UpdateLiquidacionItemPayload[];
};

type GetCosegurosParams = {
  page?: number;
};

type UpdateCoseguroOdontoPayload = {
  idAtencion: string;
  coseguroOdonto: number;
};

type GetPagosPendientesParams = {
  page?: number;
  usuario: string;
  year?: string;
  month?: string;
  estadoFuente?: "OK" | "Pendiente" | "OK+Pendiente" | "todos-visibles";
};

type CreatePagoOdontologoPayload = {
  usuario: string;
  periodoPago: string;
  items: Array<{ atencionId: string }>;
};

export async function getAtenciones({ page = 1, year, month, status, obraSocial }: GetAtencionesParams = {}) {
  try {
    const { data } = await api("/atenciones", {
      params: {
        page,
        ...(year ? { year } : {}),
        ...(month ? { month } : {}),
        ...(status ? { status } : {}),
        ...(obraSocial ? { obraSocial } : {}),
      },
    });

    const response = atencionesListResponseSchema.safeParse({
      data: data.data,
      pagination: data.pagination,
    });
    if (!response.success) {
      console.error("Error en la validación de getAtenciones:", response.error);
      throw new Error("La estructura de los datos es inválida");
    }

    if (response.success) {
      return response.data;
    }
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || error.response.data.message || "Error al obtener las atenciones");
    }

    if (error instanceof Error) {
      throw error;
    }
  }

  throw new Error("Error al obtener las atenciones");
}

export async function getAtencionesAvailableFilters() {
  try {
    const { data } = await api.get("/atenciones/filtros");

    const response = atencionesAvailableFiltersSchema.safeParse(data.data);
    if (!response.success) {
      console.error("Error en la validación de getAtencionesAvailableFilters:", response.error);
      throw new Error("La estructura de los datos es inválida");
    }

    return response.data satisfies AtencionesAvailableFilters;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || error.response.data.message || "Error al obtener los filtros disponibles");
    }

    throw new Error("Error inesperado al obtener los filtros disponibles");
  }
}

export async function getLiquidacionesAvailableFilters() {
  try {
    const { data } = await api.get("/atenciones/liquidaciones/filtros");

    const response = liquidacionesAvailableFiltersSchema.safeParse(data.data);
    if (!response.success) {
      console.error("Error en la validación de getLiquidacionesAvailableFilters:", response.error);
      throw new Error("La estructura de los datos es inválida");
    }

    return response.data satisfies LiquidacionesAvailableFilters;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || error.response.data.message || "Error al obtener los filtros de liquidaciones");
    }

    throw new Error("Error inesperado al obtener los filtros de liquidaciones");
  }
}

export async function getPagosAvailableFilters() {
  try {
    const { data } = await api.get("/atenciones/pagos/filtros");

    const response = pagosAvailableFiltersSchema.safeParse(data.data);
    if (!response.success) {
      console.error("Error en la validación de getPagosAvailableFilters:", response.error);
      throw new Error("La estructura de los datos es inválida");
    }

    return response.data satisfies PagosAvailableFilters;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || error.response.data.message || "Error al obtener los filtros de pagos");
    }

    throw new Error("Error inesperado al obtener los filtros de pagos");
  }
}

export async function getLiquidaciones({ page = 1, usuario, obraSocial, status, pagoEstado, month, year }: GetLiquidacionesParams = {}) {
  try {
    const { data } = await api.get("/atenciones/liquidaciones", {
      params: {
        page,
        ...(usuario ? { usuario } : {}),
        ...(obraSocial ? { obraSocial } : {}),
        ...(status ? { status } : {}),
        ...(pagoEstado ? { pagoEstado } : {}),
        ...(month ? { month } : {}),
        ...(year ? { year } : {}),
      },
    });

    const response = liquidacionesListResponseSchema.safeParse({
      data: data.data,
      pagination: data.pagination,
    });

    if (!response.success) {
      console.error("Error en la validación de getLiquidaciones:", response.error);
      throw new Error("La estructura de los datos es inválida");
    }

    return response.data satisfies LiquidacionesListResponse;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || error.response.data.message || "Error al obtener las liquidaciones");
    }

    throw new Error("Error inesperado al obtener las liquidaciones");
  }
}

export async function getCoseguros({ page = 1 }: GetCosegurosParams = {}) {
  try {
    const { data } = await api.get("/atenciones/coseguros", {
      params: {
        page,
      },
    });

    const response = cosegurosListResponseSchema.safeParse({
      data: data.data,
      pagination: data.pagination,
    });

    if (!response.success) {
      console.error("Error en la validación de getCoseguros:", response.error);
      throw new Error("La estructura de los datos es inválida");
    }

    return response.data satisfies CosegurosListResponse;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || error.response.data.message || "Error al obtener los coseguros");
    }

    throw new Error("Error inesperado al obtener los coseguros");
  }
}

export async function getPagosPendientes({ page = 1, usuario, year, month, estadoFuente }: GetPagosPendientesParams) {
  try {
    const { data } = await api.get("/atenciones/pagos/pendientes", {
      params: {
        page,
        usuario,
        ...(year ? { year } : {}),
        ...(month ? { month } : {}),
        ...(estadoFuente ? { estadoFuente } : {}),
      },
    });

    const response = pagosPendientesResponseSchema.safeParse({
      data: data.data,
      pagination: data.pagination,
    });

    if (!response.success) {
      console.error("Error en la validación de getPagosPendientes:", response.error);
      throw new Error("La estructura de los datos es inválida");
    }

    return response.data satisfies PagosPendientesResponse;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || error.response.data.message || "Error al obtener los pagos pendientes");
    }

    throw new Error("Error inesperado al obtener los pagos pendientes");
  }
}

export async function createPagoOdontologo(payload: CreatePagoOdontologoPayload) {
  try {
    const { data } = await api.post("/atenciones/pagos", payload);

    const response = pagoOdontologoSchema.safeParse(data.data);
    if (!response.success) {
      console.error("Error en la validación de createPagoOdontologo:", response.error);
      throw new Error("La estructura de los datos es inválida");
    }

    return {
      data: response.data satisfies PagoOdontologo,
      message: data.message as string,
    };
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || error.response.data.message || "Error al registrar el pago");
    }

    throw new Error("Error inesperado al registrar el pago");
  }
}

export async function getPagosByUsuario(idUsuario: string) {
  try {
    const { data } = await api.get(`/atenciones/pagos/odontologo/${idUsuario}`);

    const response = pagosCuentaCorrienteResponseSchema.safeParse({
      data: data.data,
    });
    if (!response.success) {
      console.error("Error en la validación de getPagosByUsuario:", response.error);
      throw new Error("La estructura de los datos es inválida");
    }

    return response.data satisfies PagosCuentaCorrienteResponse;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || error.response.data.message || "Error al obtener la cuenta corriente");
    }

    throw new Error("Error inesperado al obtener la cuenta corriente");
  }
}

export async function getAtencionesForExport({ year, month, status, obraSocial }: Omit<GetAtencionesParams, "page"> = {}) {
  try {
    const { data } = await api.get("/atenciones/export", {
      params: {
        ...(year ? { year } : {}),
        ...(month ? { month } : {}),
        ...(status ? { status } : {}),
        ...(obraSocial ? { obraSocial } : {}),
      },
    });

    const response = AtencionesTableSchema.safeParse(data.data);
    if (!response.success) {
      console.error("Error en la validación de getAtencionesForExport:", response.error);
      throw new Error("La estructura de los datos es inválida");
    }

    return response.data;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || error.response.data.message || "Error al obtener las atenciones para exportar");
    }

    throw new Error("Error inesperado al obtener las atenciones para exportar");
  }
}

export async function getAtencionByID(idAtencion: Atencion["_id"]) {
  try {
    const { data } = await api(`/atenciones/${idAtencion}`);

    const response = atencionSchema.safeParse(data.data);
    if (!response.success) {
      console.error("Error en la validación de getAtencionByID:", response.error);
      throw new Error("La estructura de los datos es inválida");
    }

    if (response.success) {
      return response.data;
    }
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || error.response.data.message || "Error al obtener la atención");
    }

    if (error instanceof Error) {
      throw error;
    }
  }

  throw new Error("Error al obtener la atención");
}

export async function getPacienteByDNI(dni: string) {
  try {
    const { data } = await api.get(`/pacientes/${dni}/busqueda`);

    const response = pacienteSchema.safeParse(data.data);
    if (!response.success) {
      console.error("Error en la validación de getPacienteByDNI:", response.error);
      throw new Error("La estructura de los datos es inválida");
    }

    return response.data satisfies Paciente;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error);
    }

    throw new Error("Error inesperado al buscar el paciente");
  }
}

export async function getCodigosByObraSocial(idObraSocial: string) {
  try {
    const { data } = await api.get(`/codigos/${idObraSocial}/obra-social`);

    const response = z.array(codigoSchema).safeParse(data.data);
    if (!response.success) {
      console.error("Error en la validación de getCodigosByObraSocial:", response.error);
      throw new Error("La estructura de los datos es inválida");
    }

    return response.data satisfies Codigo[];
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error);
    }

    throw new Error("Error inesperado al buscar los códigos");
  }
}

export async function createAtencion(formData: CreateAtencionPayload) {
  try {
    const { data } = await api.post("/atenciones", formData);
    return data;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || error.response.data.message || "Error al crear la atención");
    }

    throw new Error("Error inesperado al crear la atención");
  }
}

export async function getDisponibilidadPrestaciones({ paciente, obraSocial, fecha }: GetDisponibilidadPrestacionesParams) {
  try {
    const { data } = await api.get("/atenciones/disponibilidad-prestaciones", {
      params: {
        paciente,
        obraSocial,
        ...(fecha ? { fecha } : {}),
      },
    });

    const response = disponibilidadPrestacionesSchema.safeParse(data.data);
    if (!response.success) {
      console.error("Error en la validación de getDisponibilidadPrestaciones:", response.error);
      throw new Error("La estructura de los datos es inválida");
    }

    return response.data satisfies DisponibilidadPrestaciones;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || error.response.data.message || "Error al consultar la disponibilidad de prestaciones");
    }

    throw new Error("Error inesperado al consultar la disponibilidad de prestaciones");
  }
}

export async function updateAtencionByID({ idAtencion, ...formData }: UpdateAtencionPayload) {
  try {
    const { data } = await api.put(`/atenciones/${idAtencion}`, formData);
    return data;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || error.response.data.message || "Error al actualizar la atención");
    }

    throw new Error("Error inesperado al actualizar la atención");
  }
}

export async function updateLiquidacionItem({ idAtencion, codigoId, rowIndex, status, valor, coseguro }: UpdateLiquidacionItemPayload) {
  try {
    const { data } = await api.patch(`/atenciones/${idAtencion}/codigos/${codigoId}/liquidacion`, {
      rowIndex,
      status,
      valor,
      coseguro,
    });

    return {
      data: data.data,
      message: data.message as string,
    };
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || error.response.data.message || "Error al actualizar la liquidación");
    }

    throw new Error("Error inesperado al actualizar la liquidación");
  }
}

export async function updateLiquidacionesBulk({ items }: UpdateLiquidacionesBulkPayload) {
  try {
    const { data } = await api.patch("/atenciones/liquidaciones/bulk", {
      items,
    });

    return {
      data: data.data as { updatedCount: number; atenciones: string[] },
      message: data.message as string,
    };
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || error.response.data.message || "Error al actualizar las liquidaciones");
    }

    throw new Error("Error inesperado al actualizar las liquidaciones");
  }
}

export async function updateCoseguroOdonto({ idAtencion, coseguroOdonto }: UpdateCoseguroOdontoPayload) {
  try {
    const { data } = await api.patch(`/atenciones/${idAtencion}/coseguro-odonto`, {
      coseguroOdonto,
    });

    const response = coseguroItemSchema.safeParse(data.data);
    if (!response.success) {
      console.error("Error en la validación de updateCoseguroOdonto:", response.error);
      throw new Error("La estructura de los datos es inválida");
    }

    return {
      data: response.data satisfies CoseguroItem,
      message: data.message as string,
    };
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || error.response.data.message || "Error al actualizar el coseguro odontológico");
    }

    throw new Error("Error inesperado al actualizar el coseguro odontológico");
  }
}

export async function getResumenAtenciones() {
  try {
    const { data } = await api.get("/atenciones/resumen");

    const response = atencionesDashSchema.safeParse(data.data);
    if (!response.success) {
      console.error("Error en la validación de getResumenAtenciones:", response.error);
      throw new Error("La estructura de los datos es inválida");
    }

    return response.data satisfies AtencionesDash;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || error.response.data.message || "Error al obtener el resumen de atenciones");
    }

    throw new Error("Error inesperado al obtener el resumen de atenciones");
  }
}

export async function getAtencionesByUsuario(idUsuario: string) {
  try {
    const { data } = await api.get(`/atenciones/usuario/${idUsuario}`);

    const response = AtencionesTableSchema.safeParse(data.data);
    if (!response.success) {
      console.error("Error en la validación de getAtencionesByUsuario:", response.error);
      throw new Error("La estructura de los datos es inválida");
    }

    return response.data;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || error.response.data.message || "Error al obtener las atenciones del usuario");
    }

    throw new Error("Error inesperado al obtener las atenciones del usuario");
  }
}

export async function getAtencionesByPaciente(idPaciente: string, page = 1) {
  try {
    const { data } = await api.get(`/atenciones/paciente/${idPaciente}`, {
      params: { page },
    });

    const response = pacienteAtencionesHistorialResponseSchema.safeParse({
      data: data.data,
      pagination: data.pagination,
    });

    if (!response.success) {
      console.error("Error en la validación de getAtencionesByPaciente:", response.error);
      throw new Error("La estructura de los datos es inválida");
    }

    return response.data satisfies PacienteAtencionesHistorialResponse;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || error.response.data.message || "Error al obtener el historial del paciente");
    }

    throw new Error("Error inesperado al obtener el historial del paciente");
  }
}

export async function getAtencionesFiltradas({ periodo, status, page = 1 }: GetAtencionesFiltradasParams) {
  try {
    const { data } = await api.get("/atenciones/filtrar", {
      params: {
        periodo,
        status,
        page,
      },
    });

    const response = atencionesListResponseSchema.safeParse({
      data: data.data,
      pagination: data.pagination,
    });

    if (!response.success) {
      console.error("Error en la validación de getAtencionesFiltradas:", response.error);
      throw new Error("La estructura de los datos es inválida");
    }

    return response.data;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || error.response.data.message || "Error al obtener las atenciones filtradas");
    }

    throw new Error("Error inesperado al obtener las atenciones filtradas");
  }
}

export async function getAtencionesGlobalReport(year?: number) {
  try {
    const { data } = await api.get("/atenciones/reportes/global", {
      params: year ? { year } : undefined,
    });

    const response = atencionesGlobalReportSchema.safeParse(data.data);

    if (!response.success) {
      console.error("Error en la validación de getAtencionesGlobalReport:", response.error);
      throw new Error("La estructura de los datos es inválida");
    }

    return response.data satisfies AtencionesGlobalReport;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || error.response.data.message || "Error al obtener el reporte global de atenciones");
    }

    throw new Error("Error inesperado al obtener el reporte global de atenciones");
  }
}
