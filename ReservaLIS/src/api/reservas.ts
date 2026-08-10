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

// Public endpoint — backend verifies googleIdToken, extracts email, enforces @udea.edu.co.
// 401 = token invalid/expired/wrong domain.
export async function createReserva(body: ReservaRequestBody): Promise<ReservaResponseDTO> {
  return request<ReservaResponseDTO>(BASE, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// Public cancel — ownership proven by Google id_token sent in X-Google-Id-Token header.
// 401 = token invalid/expired; 403 = valid token but belongs to a different person.
// auth=false so 403 surfaces as ApiError rather than redirecting to admin login.
export async function cancelarReserva(
  id: number,
  googleIdToken: string,
): Promise<ReservaResponseDTO> {
  return request<ReservaResponseDTO>(`${BASE}/${id}`, {
    method: "DELETE",
    headers: { "X-Google-Id-Token": googleIdToken },
  });
}

// Admin-only hard delete — physically removes the reservation.
export async function adminDeleteReserva(id: number): Promise<void> {
  return request<void>(`${BASE}/admin/${id}`, { method: "DELETE", auth: true });
}
