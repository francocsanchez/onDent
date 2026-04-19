import api from "@/libs/axios";
import { isAxiosError } from "axios";
import { usuarioSchema, UsuariosTableSchema, type Usuario, type UsuarioFormData } from "../types";

export async function getUsuarios() {
  try {
    const { data } = await api("/usuarios");

    const response = UsuariosTableSchema.safeParse(data.data);
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

export async function changeStatusUsuario(idUsuario: Usuario["_id"]) {
  try {
    const { data } = await api.patch(`/usuarios/${idUsuario}/change-status`);

    return data;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error);
    }
  }
}

export async function createUsuario(formData: UsuarioFormData) {
  try {
    const { data } = await api.post("/usuarios", formData);
    return data;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || error.response.data.message || "Error al crear el usuario");
    }
    throw new Error("Error inesperado al crear el usuario");
  }
}

export async function getUsuarioByID(idUsuario: Usuario["_id"]) {
  try {
    const { data } = await api(`/usuarios/${idUsuario}`);

    return data.data;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error);
    }
  }
}

type UsuarioAPIType = {
  formData: UsuarioFormData;
  idUsuario: Usuario["_id"];
};

export async function updateUsuarioById({ formData, idUsuario }: UsuarioAPIType) {
  try {
    const { data } = await api.put(`/usuarios/${idUsuario}`, formData);

    return data;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error);
    }
  }
}

export async function getMe() {
  const token = localStorage.getItem("AUTH_TOKEN");
  if (!token) return null;

  const { data } = await api.get("/usuarios/me");
  const result = usuarioSchema.safeParse(data);

  if (!result.success) {
    throw new Error("Respuesta inválida del servidor");
  }

  return result.data;
}
