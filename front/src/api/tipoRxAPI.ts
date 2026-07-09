import api from "@/libs/axios";
import { isAxiosError } from "axios";
import { tipoRxSchema, tiposRxTableSchema, type TipoRx, type TipoRxFormData } from "@/types/index";

export async function getTiposRx() {
  try {
    const { data } = await api.get("/tipos-rx");

    const response = tiposRxTableSchema.safeParse(data.data);
    if (!response.success) {
      console.error("Error en la validación de getTiposRx:", response.error);
      throw new Error("La estructura de los datos es inválida");
    }

    return response.data;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || error.response.data.message || "Error al obtener los tipos de RX");
    }

    throw new Error("Error inesperado al obtener los tipos de RX");
  }
}

export async function createTipoRx(formData: TipoRxFormData) {
  try {
    const { data } = await api.post("/tipos-rx", formData);
    return data;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || error.response.data.message || "Error al crear el tipo de RX");
    }

    throw new Error("Error inesperado al crear el tipo de RX");
  }
}

export async function getTipoRxByID(idTipoRx: TipoRx["_id"]) {
  try {
    const { data } = await api.get(`/tipos-rx/${idTipoRx}`);

    const response = tipoRxSchema.safeParse(data.data);
    if (!response.success) {
      console.error("Error en la validación de getTipoRxByID:", response.error);
      throw new Error("La estructura de los datos es inválida");
    }

    return response.data;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || error.response.data.message || "Error al obtener el tipo de RX");
    }

    throw new Error("Error inesperado al obtener el tipo de RX");
  }
}

export async function updateTipoRxById({ formData, idTipoRx }: { formData: TipoRxFormData; idTipoRx: TipoRx["_id"] }) {
  try {
    const { data } = await api.put(`/tipos-rx/${idTipoRx}`, formData);
    return data;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || error.response.data.message || "Error al actualizar el tipo de RX");
    }

    throw new Error("Error inesperado al actualizar el tipo de RX");
  }
}

export async function changeStatusTipoRx(idTipoRx: TipoRx["_id"]) {
  try {
    const { data } = await api.patch(`/tipos-rx/${idTipoRx}/change-status`);
    return data;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || error.response.data.message || "Error al cambiar el estado del tipo de RX");
    }

    throw new Error("Error inesperado al cambiar el estado del tipo de RX");
  }
}
