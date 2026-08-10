import { apiFetch } from '@/lib/api/client'
import type { TopEquipmentResponse } from '@/types/api'

export function getTopReservedEquipment() {
  return apiFetch<TopEquipmentResponse[]>('/api/statistics/top-reserved')
}
