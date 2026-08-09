import api from './api'
import type { Reservation, CreateReservationRequest } from '../types/reservation'

export function getReservations() {
  return api.get<Reservation[]>('/reservations')
}

export function getReservationById(id: number) {
  return api.get<Reservation>(`/reservations/${id}`)
}

export function getEquipmentReservations(equipmentId: number) {
  return api.get<Reservation[]>(`/equipment/${equipmentId}/reservations`)
}

export function createReservation(data: CreateReservationRequest) {
  return api.post<Reservation>('/reservations', data)
}

export function cancelReservation(id: number) {
  return api.delete(`/reservations/${id}`)
}
