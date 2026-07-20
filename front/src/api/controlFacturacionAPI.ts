import api from "@/libs/axios";
import { isAxiosError } from "axios";
import {
  codigoSchema,
  controlFacturacionListResponseSchema,
  controlFacturacionPacientesListResponseSchema,
  pacienteSchema,
  type Codigo,
  type ControlFacturacionListResponse,
  type ControlFacturacionPacientesListResponse,
  type Paciente,
} from "@/types/index";
import { z } from "zod";

type CreateControlFacturacionPayload = {
  periodoMes: number;
  periodoAnio: number;
  paciente: string;
  obraSocial: string;
  usuario: string;
  items: Array<{
    codigo: string;
    pieza?: string;
    cara?: "Oclusal" | "Vestibular" | "Mesial" | "Distal" | "Lingual" | "Palatino";
  }>;
};

type GetControlFacturacionParams = {
  page?: number;
  month?: string;
  year?: string;
  patient?: string;
};

export async function createControlFacturacion(payload: CreateControlFacturacionPayload) {
  try {
    const { data } = await api.post("/control-facturacion", payload);
    return data;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || error.response.data.message || "Error al crear el control de facturación");
    }

    throw new Error("Error inesperado al crear el control de facturación");
  }
}

export async function getControlFacturacion({ page = 1, month, year, patient }: GetControlFacturacionParams = {}) {
  try {
    const { data } = await api.get("/control-facturacion", {
      params: {
        page,
        ...(month ? { month } : {}),
        ...(year ? { year } : {}),
        ...(patient ? { patient } : {}),
      },
    });

    const response = controlFacturacionListResponseSchema.safeParse({
      data: data.data,
      pagination: data.pagination,
    });

    if (!response.success) {
      console.error("Error en la validación de getControlFacturacion:", response.error);
      throw new Error("La estructura de los datos es inválida");
    }

    return response.data satisfies ControlFacturacionListResponse;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || error.response.data.message || "Error al obtener el control de facturación");
    }

    throw new Error("Error inesperado al obtener el control de facturación");
  }
}

export async function getControlFacturacionPacientes({ page = 1, month, year }: Omit<GetControlFacturacionParams, "patient"> = {}) {
  try {
    const { data } = await api.get("/control-facturacion/pacientes", {
      params: {
        page,
        ...(month ? { month } : {}),
        ...(year ? { year } : {}),
      },
    });

    const response = controlFacturacionPacientesListResponseSchema.safeParse({
      data: data.data,
      pagination: data.pagination,
    });

    if (!response.success) {
      console.error("Error en la validación de getControlFacturacionPacientes:", response.error);
      throw new Error("La estructura de los datos es inválida");
    }

    return response.data satisfies ControlFacturacionPacientesListResponse;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || error.response.data.message || "Error al obtener los pacientes");
    }

    throw new Error("Error inesperado al obtener los pacientes");
  }
}

export async function getPacienteByDNIForControlFacturacion(dni: string) {
  try {
    const { data } = await api.get(`/pacientes/${dni}/busqueda`);
    const response = pacienteSchema.safeParse(data.data);

    if (!response.success) {
      console.error("Error en la validación de getPacienteByDNIForControlFacturacion:", response.error);
      throw new Error("La estructura de los datos es inválida");
    }

    return response.data satisfies Paciente;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || error.response.data.message || "Error al buscar el paciente");
    }

    throw new Error("Error inesperado al buscar el paciente");
  }
}

export async function getCodigosByObraSocialForControlFacturacion(idObraSocial: string) {
  try {
    const { data } = await api.get(`/codigos/${idObraSocial}/obra-social`);
    const response = z.array(codigoSchema).safeParse(data.data);

    if (!response.success) {
      console.error("Error en la validación de getCodigosByObraSocialForControlFacturacion:", response.error);
      throw new Error("La estructura de los datos es inválida");
    }

    return response.data.filter((codigo: Codigo) => codigo.enable !== false) satisfies Codigo[];
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || error.response.data.message || "Error al obtener los códigos");
    }

    throw new Error("Error inesperado al obtener los códigos");
  }
}
