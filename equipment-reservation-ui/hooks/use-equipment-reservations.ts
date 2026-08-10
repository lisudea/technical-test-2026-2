'use client'

import useSWR from 'swr'
import { getEquipmentReservations } from '@/lib/api/reservations'

export function useEquipmentReservations(equipmentId: string | undefined, page = 0) {
  const { data, error, isLoading, mutate } = useSWR(
    equipmentId ? ['equipment-reservations', equipmentId, page] : null,
    () => getEquipmentReservations(equipmentId as string, page),
  )

  return {
    reservations: data?.content ?? [],
    totalPages: data?.totalPages ?? 0,
    isLoading,
    error,
    refresh: mutate,
  }
}
