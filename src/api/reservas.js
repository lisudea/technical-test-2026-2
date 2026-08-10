import { api } from "./client";

export async function listarReservas({ estado, equipoId, correoUsuario, page = 0, size = 50 } = {}) {
  const params = { page, size };
  if (estado) params.estado = estado;
  if (equipoId) params.equipoId = equipoId;
  if (correoUsuario) params.correoUsuario = correoUsuario;

  const { data } = await api.get("/reservas", { params });
  return data; // Page<ReservaResponse>
}

export async function obtenerReserva(id) {
  const { data } = await api.get(`/reservas/${id}`);
  return data;
}

export async function crearReserva(payload) {
  const { data } = await api.post("/reservas", payload);
  return data;
}

export async function cancelarReserva(id) {
  const { data } = await api.delete(`/reservas/${id}`);
  return data;
}

export async function listarReservasPorEquipo(equipoId) {
  const { data } = await api.get(`/reservas/equipo/${equipoId}`);
  return data;
}
