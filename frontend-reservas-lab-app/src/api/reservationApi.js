import { httpRequest } from './client.js'
import { PagedModelDTO, fromEntityModel } from '../models/paged.js'
import { ReservationDTO, CreateReservationDTO } from '../models/reservation.js'

const BASE = '/reservations'

/**
 * GET /api/reservations?page&size  -> reservas del usuario autenticado
 */
export async function listMyReservations({ page = 0, size = 10 } = {}) {
  const params = new URLSearchParams()
  params.set('page', String(page))
  params.set('size', String(size))

  const json = await httpRequest(`${BASE}?${params.toString()}`)
  return PagedModelDTO.fromJson(json, ReservationDTO.fromJson)
}

/**
 * GET /api/reservations/all?page&size  -> todas las reservas (solo administrador)
 */
export async function listAllReservations({ page = 0, size = 10 } = {}) {
  const params = new URLSearchParams()
  params.set('page', String(page))
  params.set('size', String(size))

  const json = await httpRequest(`${BASE}/all?${params.toString()}`)
  return PagedModelDTO.fromJson(json, ReservationDTO.fromJson)
}

/**
 * POST /api/reservations
 */
export async function createReservation(payload) {
  const body = payload instanceof CreateReservationDTO ? payload.toJson() : payload
  const json = await httpRequest(BASE, { method: 'POST', body })
  return fromEntityModel(json, ReservationDTO.fromJson)
}

/**
 * GET /api/reservations/{id}
 */
export async function getReservation(id) {
  const json = await httpRequest(`${BASE}/${id}`)
  return fromEntityModel(json, ReservationDTO.fromJson)
}

/**
 * DELETE /api/reservations/{id} -> cancela la reserva
 */
export async function cancelReservation(id) {
  return httpRequest(`${BASE}/${id}`, { method: 'DELETE' })
}