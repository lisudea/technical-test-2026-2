import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

export const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Normaliza los errores del backend (GlobalExceptionHandler) a un mensaje simple.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const data = error?.response?.data;
    let message = "Error de conexión con el servidor";

    if (data) {
      if (data.errors && typeof data.errors === "object") {
        message = Object.values(data.errors).join(" · ");
      } else if (data.message) {
        message = data.message;
      }
    } else if (error?.message) {
      message = error.message;
    }

    return Promise.reject({ ...error, friendlyMessage: message });
  }
);
