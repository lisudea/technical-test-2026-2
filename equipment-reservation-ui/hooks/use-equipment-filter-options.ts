'use client'

import useSWR from 'swr'
import { getEquipmentList } from '@/lib/api/equipment'
import type { EquipmentCategory, OperationalStatus } from '@/types/equipment'

/**
 * The backend contract doesn't expose dedicated `/categories` or
 * `/operational-statuses` endpoints, so filter options are derived
 * from the equipment collection itself (deduplicated by id).
 */
export function useEquipmentFilterOptions() {
  const { data, isLoading } = useSWR('equipment-filter-options', () => getEquipmentList({ page: 0, size: 200 }))

  const categories: EquipmentCategory[] = []
  const statuses: OperationalStatus[] = []

  const seenCategories = new Set<string>()
  const seenStatuses = new Set<string>()

  for (const item of data?.content ?? []) {
    if (!seenCategories.has(item.category.id)) {
      seenCategories.add(item.category.id)
      categories.push(item.category)
    }
    if (!seenStatuses.has(item.operationalStatus.id)) {
      seenStatuses.add(item.operationalStatus.id)
      statuses.push(item.operationalStatus)
    }
  }

  categories.sort((a, b) => a.name.localeCompare(b.name))
  statuses.sort((a, b) => a.name.localeCompare(b.name))

  return { categories, statuses, isLoading }
}
