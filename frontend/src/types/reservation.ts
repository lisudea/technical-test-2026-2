export const ReservationStatus = {
  ACTIVE: 'ACTIVE',
  CANCELLED: 'CANCELLED',
} as const
export type ReservationStatus = (typeof ReservationStatus)[keyof typeof ReservationStatus]

export interface EquipmentSummary {
  id: number
  name: string
  serialNumber: string
}

export interface UserSummary {
  id: number
  name: string
  email: string
}

export interface Reservation {
  id: number
  equipment: EquipmentSummary
  user: UserSummary
  startTime: string
  endTime: string
  createdAt: string
  status: ReservationStatus
}

export interface CreateReservationRequest {
  equipmentId: number
  userId: number
  startTime: string
  endTime: string
}
