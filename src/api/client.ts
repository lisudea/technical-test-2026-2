import { FORCE_DEMO } from '../config/env'
import { ApiError } from './http'
import * as realEquipment from './equipment'
import * as realReservations from './reservations'
import * as realStatistics from './statistics'
import * as mock from './mock/mockClient'
import type { EquipmentQuery } from './equipment'
import type {
  Equipment,
  EquipmentPayload,
  Page,
  Reservation,
  ReservationPayload,
  TopEquipment,
} from '../types/api'

/**
 * Fachada unica de datos para toda la aplicacion.
 *
 * Habla con la API real y, si detecta que el backend no responde (error de
 * red), pasa a MODO DEMOSTRACION con datos en memoria y lo anuncia en la
 * interfaz. Esto evita la pantalla en blanco cuando la API esta apagada, y
 * permite que la interfaz siga siendo evaluable.
 *
 * Solo cambia de modo ante fallos de RED. Un 404, un 409 o un 500 son
 * respuestas legitimas del backend y se propagan tal cual.
 */

let demoMode = FORCE_DEMO

type Listener = (demo: boolean) => void
const listeners = new Set<Listener>()

export function isDemoMode(): boolean {
  return demoMode
}

export function subscribeDemoMode(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function setDemoMode(value: boolean): void {
  if (demoMode === value) return
  demoMode = value
  listeners.forEach((listener) => listener(value))
}

/** Vuelve a intentar con la API real (boton "Reintentar" del aviso). */
export function retryRealApi(): void {
  if (!FORCE_DEMO) setDemoMode(false)
}

export function enableDemoMode(): void {
  setDemoMode(true)
}

function isNetworkFailure(error: unknown): boolean {
  return error instanceof ApiError && error.code === 'NETWORK'
}

/**
 * Ejecuta la llamada real y, solo si la red falla, repite contra el mock.
 */
async function withFallback<T>(real: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
  if (demoMode) return fallback()

  try {
    return await real()
  } catch (error) {
    if (isNetworkFailure(error)) {
      setDemoMode(true)
      return fallback()
    }
    throw error
  }
}

export const client = {
  fetchEquipment(query: EquipmentQuery = {}): Promise<Page<Equipment>> {
    return withFallback(
      () => realEquipment.fetchEquipment(query),
      () => mock.mockFetchEquipment(query),
    )
  },

  createEquipment(payload: EquipmentPayload): Promise<Equipment> {
    return withFallback(
      () => realEquipment.createEquipment(payload),
      () => mock.mockCreateEquipment(payload),
    )
  },

  updateEquipment(id: number, payload: EquipmentPayload): Promise<Equipment> {
    return withFallback(
      () => realEquipment.updateEquipment(id, payload),
      () => mock.mockUpdateEquipment(id, payload),
    )
  },

  fetchReservations(signal?: AbortSignal): Promise<Reservation[]> {
    return withFallback(
      () => realReservations.fetchReservations(signal),
      () => mock.mockFetchReservations(),
    )
  },

  fetchReservationsByEquipment(equipmentId: number, signal?: AbortSignal): Promise<Reservation[]> {
    return withFallback(
      () => realReservations.fetchReservationsByEquipment(equipmentId, signal),
      () => mock.mockFetchReservationsByEquipment(equipmentId),
    )
  },

  createReservation(payload: ReservationPayload): Promise<Reservation> {
    return withFallback(
      () => realReservations.createReservation(payload),
      () => mock.mockCreateReservation(payload),
    )
  },

  cancelReservation(id: number, email?: string): Promise<void> {
    return withFallback(
      () => realReservations.cancelReservation(id, email),
      () => mock.mockCancelReservation(id, email),
    )
  },

  fetchTopEquipment(signal?: AbortSignal): Promise<TopEquipment[]> {
    return withFallback(
      () => realStatistics.fetchTopEquipment(signal),
      () => mock.mockFetchTopEquipment(),
    )
  },
}