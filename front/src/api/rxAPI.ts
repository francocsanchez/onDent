import api from "@/libs/axios";
import { isAxiosError } from "axios";
import {
  rxTiposMensualReportSchema,
  rxFiltersSchema,
  rxListResponseSchema,
  type RxFilters,
  type RxListResponse,
  type RxTiposMensualReport,
} from "@/types/index";

export type CreateRxPayload = {
  fecha: string;
  paciente: string;
  derivanteTipo: "interno" | "externo";
  derivanteUsuario?: string;
  derivanteExterno?: string;
  tipoRx: string;
  valor?: number;
  usuarioCarga: string;
  observacion?: string;
};

export async function getRx(page = 1) {
  try {
    const { data } = await api.get("/rx", {
      params: { page },
    });

    const response = rxListResponseSchema.safeParse({
      data: data.data,
      pagination: data.pagination,
    });

    if (!response.success) {
      console.error("Error en la validación de getRx:", response.error);
      throw new Error("La estructura de los datos es inválida");
    }

    return response.data satisfies RxListResponse;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || error.response.data.message || "Error al obtener las RX");
    }

    throw new Error("Error inesperado al obtener las RX");
  }
}

export async function getRxFilters() {
  try {
    const { data } = await api.get("/rx/filtros");

    const response = rxFiltersSchema.safeParse(data.data);
    if (!response.success) {
      console.error("Error en la validación de getRxFilters:", response.error);
      throw new Error("La estructura de los datos es inválida");
    }

    return response.data satisfies RxFilters;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || error.response.data.message || "Error al obtener los filtros de RX");
    }

    throw new Error("Error inesperado al obtener los filtros de RX");
  }
}

export async function createRx(payload: CreateRxPayload) {
  try {
    const { data } = await api.post("/rx", payload);
    return data;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || error.response.data.message || "Error al registrar la RX");
    }

    throw new Error("Error inesperado al registrar la RX");
  }
}

export async function getRxTiposMensualReport(year?: number) {
  try {
    const { data } = await api.get("/rx/reportes/tipos-mensual", {
      params: year ? { year } : undefined,
    });

    const response = rxTiposMensualReportSchema.safeParse(data.data);
    if (!response.success) {
      console.error("Error en la validación de getRxTiposMensualReport:", response.error);
      throw new Error("La estructura de los datos es inválida");
    }

    return response.data satisfies RxTiposMensualReport;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || error.response.data.message || "Error al obtener el reporte de RX");
    }

    throw new Error("Error inesperado al obtener el reporte de RX");
  }
}
