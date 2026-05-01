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
  pacienteSchema,
  type Atencion,
  type AtencionesDash,
  type AtencionesAvailableFilters,
  type AtencionesGlobalReport,
  type Codigo,
  type DisponibilidadPrestaciones,
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
};

type GetDisponibilidadPrestacionesParams = {
  paciente: string;
  obraSocial: string;
  fecha?: string;
};

export async function getAtenciones({ page = 1, year, month, status }: GetAtencionesParams = {}) {
  try {
    const { data } = await api("/atenciones", {
      params: {
        page,
        ...(year ? { year } : {}),
        ...(month ? { month } : {}),
        ...(status ? { status } : {}),
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
      throw new Error(error.response.data.error);
    }
  }
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

export async function getAtencionesForExport({ year, month, status }: Omit<GetAtencionesParams, "page"> = {}) {
  try {
    const { data } = await api.get("/atenciones/export", {
      params: {
        ...(year ? { year } : {}),
        ...(month ? { month } : {}),
        ...(status ? { status } : {}),
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
      throw new Error(error.response.data.error);
    }
  }
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
