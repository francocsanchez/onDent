import api from "@/libs/axios";
import { isAxiosError } from "axios";

type AuthenticateUserFormData = {
  email: string;
  password: string;
};

export async function authenticateUser(formData: AuthenticateUserFormData) {
  try {
    const { data } = await api.post("/usuarios/login", formData);
    localStorage.setItem("AUTH_TOKEN", data.token);
    return data;
  } catch (error) {
    if (isAxiosError(error)) {
      throw new Error(error.response?.data?.error || error.response?.data?.message || "Error al iniciar sesión");
    }

    throw new Error("Error al iniciar sesión");
  }
}
