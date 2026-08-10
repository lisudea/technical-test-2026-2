import { api } from "./client";

export async function obtenerResumen() {
  const { data } = await api.get("/estadisticas/resumen");
  return data;
}

export async function obtenerTopEquipos() {
  const { data } = await api.get("/estadisticas/top-equipos");
  return data;
}

export async function obtenerCategorias() {
  const { data } = await api.get("/estadisticas/categorias");
  return data;
}
