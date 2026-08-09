import { request } from "./client";
import type { CategoriaDTO, CategoriaRequestBody } from "./types";

const BASE = "/api/categorias";

export async function listCategorias(): Promise<CategoriaDTO[]> {
  return request<CategoriaDTO[]>(BASE);
}

export async function createCategoria(body: CategoriaRequestBody): Promise<CategoriaDTO> {
  return request<CategoriaDTO>(BASE, {
    method: "POST",
    body: JSON.stringify(body),
    auth: true,
  });
}

export async function updateCategoria(id: number, body: CategoriaRequestBody): Promise<CategoriaDTO> {
  return request<CategoriaDTO>(`${BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
    auth: true,
  });
}

export async function deleteCategoria(id: number): Promise<void> {
  return request<void>(`${BASE}/${id}`, { method: "DELETE", auth: true });
}
