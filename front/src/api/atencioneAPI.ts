import api from "@/libs/axios";
import { isAxiosError } from "axios";
import { z } from "zod";
import { AtencionesTableSchema, atencionSchema, codigoSchema, pacienteSchema, type Atencion, type Codigo, type Paciente } from "../types";

export async function getAtenciones() {
  try {
    const { data } = await api("/atenciones");

    const response = AtencionesTableSchema.safeParse(data.data);
    if (!response.success) {
      console.error("Error en la validación de getUsuarios:", response.error);
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
