'use client'

import useSWR from 'swr'
import { getCategories, getOperationalStatuses } from '@/lib/api/catalogs'

export function useEquipmentCatalogs() {
  const categories = useSWR('categories', getCategories)
  const statuses = useSWR('operational-statuses', getOperationalStatuses)

  return {
    categories: categories.data ?? [],
    statuses: statuses.data ?? [],
    isLoading: categories.isLoading || statuses.isLoading,
    error: categories.error ?? statuses.error,
  }
}
