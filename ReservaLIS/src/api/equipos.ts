import { request } from "./client";
import type { EquipoResponseDTO, EquipoRequestBody, PageDTO } from "./types";

const BASE = "/api/equipos";

export async function listEquipos(params?: {
  page?: number;
  size?: number;
  categoriaId?: number;
  estadoFisico?: string;
}): Promise<PageDTO<EquipoResponseDTO>> {
  const qs = new URLSearchParams();
  if (params?.page !== undefined) qs.set("page", String(params.page));
  if (params?.size !== undefined) qs.set("size", String(params.size));
  if (params?.categoriaId) qs.set("categoriaId", String(params.categoriaId));
  if (params?.estadoFisico) qs.set("estadoFisico", params.estadoFisico);
  const query = qs.toString() ? `?${qs}` : "";
  return request<PageDTO<EquipoResponseDTO>>(`${BASE}${query}`);
}

export async function getEquipo(id: number): Promise<EquipoResponseDTO> {
  return request<EquipoResponseDTO>(`${BASE}/${id}`);
}

export async function createEquipo(body: EquipoRequestBody): Promise<EquipoResponseDTO> {
  return request<EquipoResponseDTO>(BASE, {
    method: "POST",
    body: JSON.stringify(body),
    auth: true,
  });
}

export async function updateEquipo(id: number, body: EquipoRequestBody): Promise<EquipoResponseDTO> {
  return request<EquipoResponseDTO>(`${BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
    auth: true,
  });
}

export async function deleteEquipo(id: number): Promise<void> {
  return request<void>(`${BASE}/${id}`, { method: "DELETE", auth: true });
}
