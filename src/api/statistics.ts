import { request } from './http'
import type { TopEquipment } from '../types/api'

/**
 * GET /api/statistics/top-equipment
 *
 * Bonus del Reto 2: los 5 equipos mas solicitados historicamente.
 */
export function fetchTopEquipment(signal?: AbortSignal): Promise<TopEquipment[]> {
  return request<TopEquipment[]>('/api/statistics/top-equipment', { signal })
}