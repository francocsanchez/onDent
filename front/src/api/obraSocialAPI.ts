import api from "@/libs/axios";
import { ObrasSocialesTableSchema, type ObraSocial, type ObraSocialFormData } from "../types";
import { isAxiosError } from "axios";

export async function createObraSocial(formData: ObraSocialFormData) {
  try {
    const { data } = await api.post("/obras-sociales", formData);
    return data;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || error.response.data.message || "Error al crear la obra social");
    }
    throw new Error("Error inesperado al crear la obra social");
  }
}

export async function getObrasSociales() {
  try {
    const { data } = await api("/obras-sociales");

    const response = ObrasSocialesTableSchema.safeParse(data.data);
    if (!response.success) {
      console.error("Error en la validación de getObrasSociales:", response.error);
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

export async function getObrasSocialByID(idObraSocial: ObraSocial["_id"]) {
  try {
    const { data } = await api(`/obras-sociales/${idObraSocial}`);

    return data.data as ObraSocial;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error);
    }
  }
}

export async function changeStatusObraSocial(idObraSocial: ObraSocial["_id"]) {
  try {
    const { data } = await api.patch(`/obras-sociales/${idObraSocial}/change-status`);

    return data;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error);
    }
  }
}

type ObraSocialAPIType = {
  formData: ObraSocialFormData;
  idObraSocial: ObraSocial["_id"];
};

export async function updateObraSocialById({ formData, idObraSocial }: ObraSocialAPIType) {
  try {
    const { data } = await api.put(`/obras-sociales/${idObraSocial}`, formData);

    return data;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error);
    }
  }
}
