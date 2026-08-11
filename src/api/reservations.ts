import { request } from './http'
import type { Reservation, ReservationPayload } from '../types/api'

/** GET /api/reservations - publica. */
export function fetchReservations(signal?: AbortSignal): Promise<Reservation[]> {
  return request<Reservation[]>('/api/reservations', { signal })
}

/**
 * GET /api/reservations/equipment/{id} - publica.
 * La usa el modal de reserva para enseñar las franjas ya ocupadas antes de
 * que el usuario elija una hora.
 */
export function fetchReservationsByEquipment(
  equipmentId: number,
  signal?: AbortSignal,
): Promise<Reservation[]> {
  return request<Reservation[]>(`/api/reservations/equipment/${equipmentId}`, { signal })
}

/**
 * POST /api/reservations
 *
 * Devuelve 201, o **409** si la franja se cruza con otra reserva activa del
 * mismo equipo. Ese 409 es el que la interfaz convierte en un aviso claro.
 */
export function createReservation(payload: ReservationPayload): Promise<Reservation> {
  return request<Reservation>('/api/reservations', { method: 'POST', body: payload, auth: true })
}

/**
 * DELETE /api/reservations/{id} -> 204
 *
 * Cancelacion logica. Sin sesion hay que mandar el correo con el que se creo
 * la reserva; si no coincide con el dueño, el backend responde 403.
 */
export function cancelReservation(id: number, email?: string): Promise<void> {
  return request<void>(`/api/reservations/${id}`, {
    method: 'DELETE',
    query: { email },
    auth: true,
  })
}