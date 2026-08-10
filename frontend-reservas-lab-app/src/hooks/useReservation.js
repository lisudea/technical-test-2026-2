import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { reservationApi } from '../api'
import { ReservationStatus } from '../models/enums.js'
import { usePagination } from './usePagination.js'

const AGGREGATE_PAGE_SIZE = 100
const MAX_PAGES = 100

/**
 * Recorre todas las paginas que devuelve el backend para obtener la lista
 * completa (propias o de toda la plataforma) y poder calcular conteos por
 * estado. El endpoint de reservas no expone un filtro por estado, asi que la
 * segmentacion se hace en el cliente una vez reunidos los registros.
 */
async function fetchReservationCatalog(scope) {
  const items = []
  let page = 0
  let totalElements = 0

  while (page < MAX_PAGES) {
    const result =
      scope === 'all'
        ? await reservationApi.listAllReservations({ page, size: AGGREGATE_PAGE_SIZE })
        : await reservationApi.listMyReservations({ page, size: AGGREGATE_PAGE_SIZE })

    totalElements = result.metadata?.totalElements ?? items.length
    items.push(...result.content)

    if (result.content.length === 0 || items.length >= totalElements) {
      break
    }
    page += 1
  }

  return { items, total: items.length }
}

/**
 * Catalogo completo de reservas segun el alcance:
 *   scope = 'mine' -> reservas del usuario autenticado (GET /api/reservations)
 *   scope = 'all'  -> todas las reservas de la plataforma (GET /api/reservations/all, solo admin)
 *
 * Expone listados y conteos por estado: activas (CREADA), canceladas (CANCELADA).
 */
export function useReservationCatalog(scope = 'mine') {
  const [state, setState] = useState({ items: [], total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [nonce, setNonce] = useState(0)
  const cancelRef = useRef(false)

  const reload = useCallback(() => setNonce((n) => n + 1), [])

  useEffect(() => {
    cancelRef.current = false
    setLoading(true)
    setError(null)

    fetchReservationCatalog(scope)
      .then((data) => {
        if (!cancelRef.current) setState(data)
      })
      .catch((err) => {
        if (!cancelRef.current) setError(err)
      })
      .finally(() => {
        if (!cancelRef.current) setLoading(false)
      })

    return () => {
      cancelRef.current = true
    }
  }, [scope, nonce])

  const active = useMemo(
    () => state.items.filter((r) => r.status === ReservationStatus.CREADA),
    [state.items],
  )
  const cancelled = useMemo(
    () => state.items.filter((r) => r.status === ReservationStatus.CANCELADA),
    [state.items],
  )

  return {
    items: state.items,
    total: state.total,
    active,
    cancelled,
    loading,
    error,
    reload,
  }
}

/**
 * Filtro por estado + paginado local (el backend no filtra reservas por estado).
 * Opciones del filtro: 'activas' (por defecto) | 'canceladas' | 'todas'.
 */
export function useReservationFilter(items, initial = 'activas', pageSize = 10) {
  const [statusFilter, setStatusFilter] = useState(initial)
  const { page, size, setPage } = usePagination(pageSize)

  const filtered = useMemo(() => {
    if (statusFilter === 'canceladas') {
      return items.filter((r) => r.status === ReservationStatus.CANCELADA)
    }
    if (statusFilter === 'activas') {
      return items.filter((r) => r.status === ReservationStatus.CREADA)
    }
    return items
  }, [items, statusFilter])

  const changeStatus = useCallback(
    (next) => {
      setStatusFilter(next)
      setPage(0)
    },
    [setPage],
  )

  const pageItems = useMemo(
    () => filtered.slice(page * size, (page + 1) * size),
    [filtered, page, size],
  )

  return {
    statusFilter,
    setStatusFilter: changeStatus,
    filtered,
    pageItems,
    total: filtered.length,
    totalPages: Math.max(1, Math.ceil(filtered.length / size)),
    page,
    setPage,
    size,
  }
}

/**
 * Acciones sobre reservas (crear / cancelar / consultar). Estas operaciones
 * relanzan los errores para que la interfaz muestre el mensaje del backend
 * (p. ej. un 409 por horario traslapado).
 */
export function useReservationActions() {
  const [submitting, setSubmitting] = useState(false)
  const [lastError, setLastError] = useState(null)

  const create = useCallback(async (payload) => {
    setSubmitting(true)
    setLastError(null)
    try {
      const reservation = await reservationApi.createReservation(payload)
      return reservation
    } catch (err) {
      setLastError(err)
      throw err
    } finally {
      setSubmitting(false)
    }
  }, [])

  const cancel = useCallback(async (id) => {
    setSubmitting(true)
    setLastError(null)
    try {
      await reservationApi.cancelReservation(id)
    } catch (err) {
      setLastError(err)
      throw err
    } finally {
      setSubmitting(false)
    }
  }, [])

  return { create, cancel, getById: reservationApi.getReservation, submitting, lastError }
}