import { ApiError } from '../http'
import { DEMO_EQUIPMENT, DEMO_RESERVATIONS } from './data'
import type {
  Equipment,
  EquipmentPayload,
  Page,
  Reservation,
  ReservationPayload,
  TopEquipment,
} from '../../types/api'
import type { EquipmentQuery } from '../equipment'

/**
 * Implementacion en memoria con la MISMA interfaz que el cliente real.
 *
 * Sirve para que la interfaz siga siendo evaluable si el backend no esta
 * levantado. Lo importante: reproduce fielmente la regla de solapamiento y el
 * error 409, de modo que el requisito 6 del Reto 3 (manejo de errores en la
 * UI) se puede demostrar en cualquier circunstancia.
 *
 * Los datos viven solo en memoria: al recargar la pagina se reinician.
 */

const equipment: Equipment[] = DEMO_EQUIPMENT.map((e) => ({ ...e }))
const reservations: Reservation[] = DEMO_RESERVATIONS.map((r) => ({ ...r }))

let nextEquipmentId = equipment.length + 1
let nextReservationId = reservations.length + 1

/** Simula la latencia de red para que los estados de carga sean visibles. */
function delay<T>(value: T, ms = 220): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

function nowIso(): string {
  return new Date().toISOString().slice(0, 19)
}

export function mockFetchEquipment(query: EquipmentQuery = {}): Promise<Page<Equipment>> {
  const { category, status, page = 0, size = 12 } = query

  const filtered = equipment.filter(
    (e) => (!category || e.category === category) && (!status || e.status === status),
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / size))
  const content = filtered.slice(page * size, page * size + size)

  return delay({
    content,
    totalElements: filtered.length,
    totalPages,
    number: page,
    size,
    first: page === 0,
    last: page >= totalPages - 1,
  })
}

export function mockCreateEquipment(payload: EquipmentPayload): Promise<Equipment> {
  if (equipment.some((e) => e.serialNumber === payload.serialNumber)) {
    return Promise.reject(
      new ApiError(
        409,
        'CONFLICT',
        'Ya existe un equipo con ese numero de serie',
        [],
        'DUPLICATE_RESOURCE',
      ),
    )
  }

  const created: Equipment = {
    id: nextEquipmentId++,
    ...payload,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }

  equipment.unshift(created)
  return delay(created)
}

export function mockUpdateEquipment(id: number, payload: EquipmentPayload): Promise<Equipment> {
  const index = equipment.findIndex((e) => e.id === id)

  if (index === -1) {
    return Promise.reject(new ApiError(404, 'NOT_FOUND', `No existe el equipo con id ${id}`))
  }

  const duplicated = equipment.some(
    (e) => e.id !== id && e.serialNumber === payload.serialNumber,
  )

  if (duplicated) {
    return Promise.reject(
      new ApiError(
        409,
        'CONFLICT',
        'Ya existe un equipo con ese numero de serie',
        [],
        'DUPLICATE_RESOURCE',
      ),
    )
  }

  equipment[index] = { ...equipment[index], ...payload, updatedAt: nowIso() }
  return delay(equipment[index])
}

export function mockFetchReservations(): Promise<Reservation[]> {
  return delay([...reservations].sort((a, b) => b.startTime.localeCompare(a.startTime)))
}

export function mockFetchReservationsByEquipment(equipmentId: number): Promise<Reservation[]> {
  return delay(reservations.filter((r) => r.equipmentId === equipmentId))
}

/** Duracion maxima, igual que `app.reservations.max-hours` en el backend. */
const MAX_HORAS_RESERVA = 8

export function mockCreateReservation(payload: ReservationPayload): Promise<Reservation> {
  const target = equipment.find((e) => e.id === payload.equipmentId)

  if (!target) {
    return Promise.reject(
      new ApiError(404, 'NOT_FOUND', `No existe el equipo con id ${payload.equipmentId}`, [], 'EQUIPMENT_NOT_FOUND'),
    )
  }

  if (payload.startTime >= payload.endTime) {
    return Promise.reject(
      new ApiError(400, 'VALIDATION', 'La hora de inicio debe ser anterior a la de fin', [], 'INVALID_TIME_RANGE'),
    )
  }

  const horas =
    (new Date(payload.endTime).getTime() - new Date(payload.startTime).getTime()) / 3_600_000

  if (horas > MAX_HORAS_RESERVA) {
    return Promise.reject(
      new ApiError(
        400,
        'VALIDATION',
        `La reserva no puede superar las ${MAX_HORAS_RESERVA} horas`,
        [],
        'RESERVATION_TOO_LONG',
      ),
    )
  }

  if (target.status === 'MAINTENANCE') {
    return Promise.reject(
      new ApiError(
        409,
        'CONFLICT',
        `El equipo '${target.name}' esta en mantenimiento y no admite reservas`,
        [],
        'EQUIPMENT_IN_MAINTENANCE',
      ),
    )
  }

  if (!payload.userName?.trim() || !payload.userEmail?.trim()) {
    return Promise.reject(
      new ApiError(
        400,
        'VALIDATION',
        "Debes indicar 'userName' y 'userEmail' para reservar",
        [],
        'IDENTITY_REQUIRED',
      ),
    )
  }

  // Misma regla que el backend: intervalos semiabiertos [inicio, fin).
  // Dos franjas contiguas NO se consideran conflicto.
  const overlaps = reservations.some(
    (r) =>
      r.equipmentId === payload.equipmentId &&
      r.status === 'ACTIVE' &&
      r.startTime < payload.endTime &&
      r.endTime > payload.startTime,
  )

  if (overlaps) {
    return Promise.reject(
      new ApiError(
        409,
        'CONFLICT',
        `El equipo con id ${payload.equipmentId} ya tiene una reserva que se cruza con la franja horaria solicitada`,
        [],
        'RESERVATION_OVERLAP',
      ),
    )
  }

  const created: Reservation = {
    id: nextReservationId++,
    equipmentId: target.id,
    equipmentName: target.name,
    userId: 99,
    userName: payload.userName ?? 'Usuario Demo LIS',
    userEmail: payload.userEmail ?? 'demo.lis@udea.edu.co',
    startTime: payload.startTime,
    endTime: payload.endTime,
    status: 'ACTIVE',
    createdAt: nowIso(),
  }

  reservations.push(created)
  return delay(created)
}

export function mockCancelReservation(id: number, email?: string): Promise<void> {
  const reservation = reservations.find((r) => r.id === id)

  if (!reservation) {
    return Promise.reject(new ApiError(404, 'NOT_FOUND', `No existe la reserva con id ${id}`))
  }

  if (email && reservation.userEmail.toLowerCase() !== email.toLowerCase()) {
    return Promise.reject(
      new ApiError(
        403,
        'FORBIDDEN',
        'Solo puedes cancelar las reservas creadas con tu propio correo',
      ),
    )
  }

  reservation.status = 'CANCELLED'
  return delay(undefined)
}

export function mockFetchTopEquipment(): Promise<TopEquipment[]> {
  const counts = new Map<number, number>()

  for (const r of reservations) {
    counts.set(r.equipmentId, (counts.get(r.equipmentId) ?? 0) + 1)
  }

  const top = [...counts.entries()]
    .map(([equipmentId, reservationCount]) => ({
      equipmentId,
      equipmentName: equipment.find((e) => e.id === equipmentId)?.name ?? `#${equipmentId}`,
      reservationCount,
    }))
    .sort((a, b) => b.reservationCount - a.reservationCount)
    .slice(0, 5)

  return delay(top)
}