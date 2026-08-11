import { request } from './http'
import type {
  Equipment,
  EquipmentCategory,
  EquipmentPayload,
  EquipmentStatus,
  Page,
} from '../types/api'

export interface EquipmentQuery {
  category?: EquipmentCategory | ''
  status?: EquipmentStatus | ''
  page?: number
  size?: number
  sort?: string
  signal?: AbortSignal
}

/**
 * GET /api/equipment
 *
 * Listado avanzado del enunciado: paginado y filtrable por categoria y estado.
 * Los filtros vacios no se envian (ver buildUrl en http.ts).
 */
export function fetchEquipment(query: EquipmentQuery = {}): Promise<Page<Equipment>> {
  const { category, status, page, size, sort, signal } = query

  return request<Page<Equipment>>('/api/equipment', {
    query: { category, status, page, size, sort },
    signal,
  })
}

export function fetchEquipmentById(id: number, signal?: AbortSignal): Promise<Equipment> {
  return request<Equipment>(`/api/equipment/${id}`, { signal })
}

/** POST /api/equipment -> 201, o 409 si el numero de serie ya existe. */
export function createEquipment(payload: EquipmentPayload): Promise<Equipment> {
  return request<Equipment>('/api/equipment', { method: 'POST', body: payload, auth: true })
}

export function updateEquipment(id: number, payload: EquipmentPayload): Promise<Equipment> {
  return request<Equipment>(`/api/equipment/${id}`, { method: 'PUT', body: payload, auth: true })
}