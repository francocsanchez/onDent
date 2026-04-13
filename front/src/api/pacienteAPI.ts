import api from "@/libs/axios";
import { isAxiosError } from "axios";
import { PacientesTableSchema, type Paciente, type PacienteFormData } from "../types";

export async function getPacientes() {
  try {
    const { data } = await api("/pacientes");

    const response = PacientesTableSchema.safeParse(data.data);
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

export async function createPaciente(formData: PacienteFormData) {
  try {
    const { data } = await api.post("/pacientes", formData);
    return data;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || error.response.data.message || "Error al crear el paciente");
    }
    throw new Error("Error inesperado al crear el paciente");
  }
}

export async function getPacienteByID(idPaciente: Paciente["_id"]) {
  try {
    const { data } = await api(`/pacientes/${idPaciente}`);

    return data.data;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error);
    }
  }
}

type PacienteAPIType = {
  formData: PacienteFormData;
  idPaciente: Paciente["_id"];
};

export async function updatePacienteById({ formData, idPaciente }: PacienteAPIType) {
  try {
    const { data } = await api.put(`/pacientes/${idPaciente}`, formData);

    return data;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error);
    }
  }
}
