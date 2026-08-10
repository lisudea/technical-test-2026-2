'use client'

import useSWR from 'swr'
import { getEquipmentList } from '@/lib/api/equipment'
import type { EquipmentListFilters } from '@/types/equipment'

export function useEquipmentList(filters: EquipmentListFilters) {
  const key = ['equipment-list', filters.page, filters.size, filters.categoryId, filters.operationalStatusId, filters.query]

  const { data, error, isLoading, mutate } = useSWR(key, () => getEquipmentList(filters), {
    keepPreviousData: true,
  })

  return {
    equipmentPage: data,
    isLoading,
    error,
    refresh: mutate,
  }
}
