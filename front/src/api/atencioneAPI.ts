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
  disponibilidadPrestacionesSchema,
  coseguroItemSchema,
  cosegurosListResponseSchema,
  liquidacionItemSchema,
  liquidacionesAvailableFiltersSchema,
  liquidacionesListResponseSchema,
  pacienteSchema,
  type Atencion,
  type AtencionesDash,
  type AtencionesAvailableFilters,
  type AtencionesGlobalReport,
  type Codigo,
  type CoseguroItem,
  type CosegurosListResponse,
  type DisponibilidadPrestaciones,
  type LiquidacionItem,
  type LiquidacionesAvailableFilters,
  type LiquidacionesListResponse,
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
    status: AtencionStatus;
    observaciones?: string;
  }[];
  observaciones?: string;
  coseguro?: number;
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
  month?: string;
  year?: string;
};

type UpdateLiquidacionItemPayload = {
  idAtencion: string;
  codigoId: string;
  status: AtencionStatus;
  valor: number;
};

type GetCosegurosParams = {
  page?: number;
};

type UpdateCoseguroOdontoPayload = {
  idAtencion: string;
  coseguroOdonto: number;
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

export async function getLiquidaciones({ page = 1, usuario, obraSocial, status, month, year }: GetLiquidacionesParams = {}) {
  try {
    const { data } = await api.get("/atenciones/liquidaciones", {
      params: {
        page,
        ...(usuario ? { usuario } : {}),
        ...(obraSocial ? { obraSocial } : {}),
        ...(status ? { status } : {}),
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

export async function updateLiquidacionItem({ idAtencion, codigoId, status, valor }: UpdateLiquidacionItemPayload) {
  try {
    const { data } = await api.patch(`/atenciones/${idAtencion}/codigos/${codigoId}/liquidacion`, {
      status,
      valor,
    });

    const response = liquidacionItemSchema.safeParse(data.data);
    if (!response.success) {
      console.error("Error en la validación de updateLiquidacionItem:", response.error);
      throw new Error("La estructura de los datos es inválida");
    }

    return {
      data: response.data satisfies LiquidacionItem,
      message: data.message as string,
    };
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || error.response.data.message || "Error al actualizar la liquidación");
    }

    throw new Error("Error inesperado al actualizar la liquidación");
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
