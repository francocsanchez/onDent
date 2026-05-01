import api from "@/libs/axios";
import { isAxiosError } from "axios";

type AuthenticateUserFormData = {
  email: string;
  password: string;
};

type UpdateMyPasswordFormData = {
  newPassword: string;
};

type RecoverPasswordFormData = {
  email: string;
};

export async function authenticateUser(formData: AuthenticateUserFormData) {
  try {
    const { data } = await api.post("/auth/login", formData);
    localStorage.setItem("AUTH_TOKEN", data.token);
    return data;
  } catch (error) {
    if (isAxiosError(error)) {
      throw new Error(error.response?.data?.error || error.response?.data?.message || "Error al iniciar sesión");
    }

    throw new Error("Error al iniciar sesión");
  }
}

export async function updateMyPassword(formData: UpdateMyPasswordFormData) {
  try {
    const { data } = await api.patch("/usuarios/me/password", formData);
    return data;
  } catch (error) {
    if (isAxiosError(error)) {
      throw new Error(error.response?.data?.error || error.response?.data?.message || "Error al actualizar la contraseña");
    }

    throw new Error("Error al actualizar la contraseña");
  }
}

export async function recoverPassword(formData: RecoverPasswordFormData) {
  try {
    const { data } = await api.post("/auth/forgot-password", formData);
    return data;
  } catch (error) {
    if (isAxiosError(error)) {
      throw new Error(error.response?.data?.error || error.response?.data?.message || "Error al recuperar la contraseña");
    }

    throw new Error("Error al recuperar la contraseña");
  }
}
