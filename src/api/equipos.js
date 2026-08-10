import { api } from "./client";

export const CATEGORIAS = [
  "MICROCONTROLADORES",
  "REALIDAD_VIRTUAL",
  "REDES",
  "COMPUTADORES",
  "IMPRESORAS_3D",
  "SENSORES",
];

export const ESTADOS_EQUIPO = ["DISPONIBLE", "RESERVADO", "EN_MANTENIMIENTO"];

// Estados que se pueden asignar manualmente al crear/editar (RESERVADO es automático).
export const ESTADOS_EQUIPO_EDITABLES = ["DISPONIBLE", "EN_MANTENIMIENTO"];

export async function listarEquipos({ search, categoria, estado, page = 0, size = 50, sort = "nombre" } = {}) {
  const params = { page, size, sort };
  if (search) params.search = search;
  if (categoria) params.categoria = categoria;
  if (estado) params.estado = estado;

  const { data } = await api.get("/equipos", { params });
  return data; // Page<EquipoResponse>
}

export async function obtenerEquipo(id) {
  const { data } = await api.get(`/equipos/${id}`);
  return data;
}

export async function crearEquipo(payload) {
  const { data } = await api.post("/equipos", payload);
  return data;
}

export async function actualizarEquipo(id, payload) {
  const { data } = await api.put(`/equipos/${id}`, payload);
  return data;
}

export async function eliminarEquipo(id) {
  await api.delete(`/equipos/${id}`);
}
