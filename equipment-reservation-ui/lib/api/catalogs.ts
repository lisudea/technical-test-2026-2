import { apiFetch } from '@/lib/api/client'
import type { EquipmentCategory, OperationalStatus } from '@/types/equipment'

export async function getCategories(): Promise<EquipmentCategory[]> {
  const categories = await apiFetch<Array<Omit<EquipmentCategory, 'id'> & { id: string | number }>>('/api/categories')
  return categories.map((category) => ({ ...category, id: String(category.id) }))
}

export async function getOperationalStatuses(): Promise<OperationalStatus[]> {
  const statuses = await apiFetch<Array<Omit<OperationalStatus, 'id'> & { id: string | number }>>('/api/operational-statuses')
  return statuses.map((status) => ({ ...status, id: String(status.id) }))
}
