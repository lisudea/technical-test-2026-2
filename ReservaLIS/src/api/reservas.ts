import { request } from "./client";
import type { ReservaResponseDTO, ReservaRequestBody, PageDTO } from "./types";

const BASE = "/api/reservas";

export async function listReservas(params?: {
  page?: number;
  size?: number;
  equipoId?: number;
  estadoReserva?: string;
}): Promise<PageDTO<ReservaResponseDTO>> {
  const qs = new URLSearchParams();
  if (params?.page !== undefined) qs.set("page", String(params.page));
  if (params?.size !== undefined) qs.set("size", String(params.size));
  if (params?.equipoId) qs.set("equipoId", String(params.equipoId));
  if (params?.estadoReserva) qs.set("estadoReserva", params.estadoReserva);
  const query = qs.toString() ? `?${qs}` : "";
  return request<PageDTO<ReservaResponseDTO>>(`${BASE}${query}`);
}

export async function createReserva(body: ReservaRequestBody): Promise<ReservaResponseDTO> {
  return request<ReservaResponseDTO>(BASE, {
    method: "POST",
    body: JSON.stringify(body),
    // Public endpoint — no auth header needed
  });
}

// Public cancel: correo is used server-side to verify ownership (case-insensitive).
// Returns 403 if correo doesn't match — NOT redirected to login because auth=false.
export async function cancelarReserva(
  id: number,
  correo: string,
): Promise<ReservaResponseDTO> {
  const qs = new URLSearchParams({ correo });
  return request<ReservaResponseDTO>(`${BASE}/${id}?${qs}`, { method: "DELETE" });
}

// Admin-only hard delete — physically removes the reservation.
export async function adminDeleteReserva(id: number): Promise<void> {
  return request<void>(`${BASE}/admin/${id}`, { method: "DELETE", auth: true });
}
