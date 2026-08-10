import { apiFetch } from '@/lib/api/client'
import type { Page } from '@/types/common'
import type {
  AvailabilityResponse,
  Equipment,
  EquipmentInput,
  EquipmentListFilters,
} from '@/types/equipment'

export function getEquipmentList(filters: EquipmentListFilters = {}) {
  const { page = 0, size = 12, categoryId, operationalStatusId, query } = filters
  return apiFetch<Page<Equipment>>('/api/equipment', {
    searchParams: { page, size, categoryId, operationalStatusId, query },
  }).then((page) => ({ ...page, content: page.content.map(normalizeEquipment) }))
}

function normalizeEquipment(equipment: Equipment): Equipment {
  return {
    ...equipment,
    id: String(equipment.id),
    category: { ...equipment.category, id: String(equipment.category.id) },
    operationalStatus: { ...equipment.operationalStatus, id: String(equipment.operationalStatus.id) },
  }
}

export function createEquipment(input: EquipmentInput) {
  return apiFetch<Equipment>('/api/equipment', {
    method: 'POST',
    body: input,
  })
}

export function updateEquipment(id: string, input: EquipmentInput) {
  return apiFetch<Equipment>(`/api/equipment/${id}`, {
    method: 'PUT',
    body: input,
  })
}

export function getEquipmentAvailability(id: string, startAt: string, endAt: string) {
  return apiFetch<AvailabilityResponse>(`/api/equipment/${id}/availability`, {
    searchParams: { startAt, endAt },
  })
}
