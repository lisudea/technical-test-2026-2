import { apiFetch } from '@/lib/api/client'
import type { Page } from '@/types/common'
import type { Reservation, ReservationInput, ReservationListFilters } from '@/types/reservation'

export interface ApiReservation {
  id: number | string
  equipment: { id: number | string; name: string }
  userName: string
  userEmail?: string
  startAt: string
  endAt: string
  status: { name: Reservation['status'] }
  createdAt: string
}

export function toReservation(reservation: ApiReservation): Reservation {
  return {
    id: String(reservation.id),
    equipmentId: String(reservation.equipment.id),
    equipmentName: reservation.equipment.name,
    requesterName: reservation.userName,
    requesterEmail: reservation.userEmail,
    startAt: reservation.startAt,
    endAt: reservation.endAt,
    status: reservation.status.name,
    createdAt: reservation.createdAt,
  }
}

export async function getEquipmentReservations(equipmentId: string, page = 0, size = 10): Promise<Page<Reservation>> {
  const response = await apiFetch<Page<ApiReservation>>(`/api/equipment/${equipmentId}/reservations`, {
    searchParams: { page, size },
  })
  return { ...response, content: response.content.map(toReservation) }
}

export async function getReservations(filters: ReservationListFilters = {}): Promise<Page<Reservation>> {
  const { page = 0, size = 10, status, query } = filters
  const response = await apiFetch<Page<ApiReservation>>('/api/reservations', {
    searchParams: { page, size, status, query },
  })
  return { ...response, content: response.content.map(toReservation) }
}

export function createReservation(input: ReservationInput) {
  return apiFetch<ApiReservation>('/api/reservations', {
    method: 'POST',
    body: {
      equipmentId: input.equipmentId,
      userName: input.requesterName,
      userEmail: input.requesterEmail,
      startAt: input.startAt,
      endAt: input.endAt,
    },
  }).then(toReservation)
}

export function cancelReservation(id: string) {
  return apiFetch<ApiReservation>(`/api/reservations/${id}/cancel`, {
    method: 'PATCH',
  }).then(toReservation)
}
