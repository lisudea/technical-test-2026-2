'use client'

import useSWR from 'swr'
import { getReservations } from '@/lib/api/reservations'
import type { ReservationListFilters } from '@/types/reservation'

export function useReservationsList(filters: ReservationListFilters) {
  const { data, error, isLoading, mutate } = useSWR(['reservations', filters], () => getReservations(filters), {
    keepPreviousData: true,
  })

  return {
    reservations: data?.content ?? [],
    totalPages: data?.totalPages ?? 0,
    totalElements: data?.totalElements ?? 0,
    isLoading,
    error,
    refresh: mutate,
  }
}
