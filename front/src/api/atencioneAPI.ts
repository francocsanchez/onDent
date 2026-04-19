import api from "@/libs/axios";
import { isAxiosError } from "axios";
import { z } from "zod";
import {
  atencionesDashSchema,
  atencionesListResponseSchema,
  atencionSchema,
  codigoSchema,
  pacienteSchema,
  type Atencion,
  type AtencionesDash,
  type Codigo,
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

type GetAtencionesFiltradasParams = {
  periodo: string;
  status: AtencionStatus;
  page?: number;
};

export async function getAtenciones(page = 1) {
  try {
    const { data } = await api("/atenciones", {
      params: { page },
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
