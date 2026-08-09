import { request } from "./client";
import type { TopEquipoDTO } from "./types";

export async function getTopEquipos(params?: {
  desde?: string; // ISO-8601 LocalDateTime e.g. "2026-08-01T00:00:00"
  hasta?: string;
}): Promise<TopEquipoDTO[]> {
  const qs = new URLSearchParams();
  if (params?.desde) qs.set("desde", params.desde);
  if (params?.hasta) qs.set("hasta", params.hasta);
  const query = qs.toString() ? `?${qs}` : "";
  return request<TopEquipoDTO[]>(`/api/estadisticas/top-equipos${query}`);
}
