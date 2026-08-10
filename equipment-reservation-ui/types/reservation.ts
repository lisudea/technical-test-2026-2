export type ReservationStatus = 'ACTIVE' | 'CANCELLED' | 'COMPLETED'

export interface Reservation {
  id: string
  equipmentId: string
  equipmentName: string
  requesterName: string
  requesterEmail?: string
  purpose?: string
  startAt: string
  endAt: string
  status: ReservationStatus
  createdAt: string
}

export interface ReservationInput {
  equipmentId: string
  requesterName: string
  requesterEmail?: string
  purpose?: string
  startAt: string
  endAt: string
}

export interface ReservationListFilters {
  page?: number
  size?: number
  status?: ReservationStatus
  query?: string
}
