'use client'

import useSWR from 'swr'
import { getTopReservedEquipment } from '@/lib/api/statistics'
import type { TopEquipmentResponse } from '@/types/api'

export function useTopReserved(limit = 5) {
  const { data, error, isLoading } = useSWR('top-reserved', getTopReservedEquipment)

  return {
    topReserved: (data ?? []).slice(0, limit) as TopEquipmentResponse[],
    isLoading,
    error,
  }
}
