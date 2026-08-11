// src/services/api.js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Antes de cada petición, si hay un token guardado, lo agregamos automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Equipos ---
export function obtenerEquipos(params = {}) {
  return api.get("/equipos", { params });
}

// --- Reservas ---
export function crearReserva(datos) {
  return api.post("/reservas", datos);
}

export function obtenerTopEquipos() {
  return api.get("/reservas/estadisticas/top-equipos");
}

// --- Autenticación ---
export function loginConGoogle(credential) {
  return api.post("/auth/google", { credential });
}

export default api;