import { useCallback, useEffect, useState } from 'react'
import { listarReservas } from '../api/reservas'
import type { EstadoReserva, PageResponse, Reserva } from '../api/types'

// Este archivo contiene un hook personalizado llamado useReservas que se utiliza para manejar la lógica de filtrado,
// paginación y manejo de errores al listar reservas desde la API.

// La constante RESERVAS_PAGE_SIZE define el tamaño de página utilizado al consultar reservas desde la API.
export const RESERVAS_PAGE_SIZE = 10

// Los tipos FiltroEquipo y FiltroEstadoReserva representan los posibles valores de los filtros de equipo y estado.
export type FiltroEquipo = number | ''
export type FiltroEstadoReserva = EstadoReserva | ''

// La interfaz ReservasFiltros representa los filtros actuales de equipo y estado aplicados al listado de reservas.
export interface ReservasFiltros {
  equipoId: FiltroEquipo
  estado: FiltroEstadoReserva
}

// La interfaz UseReservasResult representa el objeto devuelto por el hook useReservas. Contiene los filtros
// actuales, la página actual, los datos de las reservas, el estado de carga y error, y funciones para cambiar
// filtros, limpiar filtros, cambiar página y reintentar la solicitud en caso de error.
export interface UseReservasResult {
  filtros: ReservasFiltros
  cambiarFiltros: (next: Partial<ReservasFiltros>) => void
  limpiarFiltros: () => void
  cambiarPagina: (page: number) => void
  data: PageResponse<Reserva> | null
  loading: boolean
  error: unknown
  reintentar: () => void
}

// El hook useReservas maneja la lógica de filtrado, paginación y manejo de errores al listar reservas desde la API.
// Utiliza useState para controlar los filtros, la página actual, los datos cargados, el estado de carga y error,
// así como un contador de intentos para reintentar la solicitud en caso de fallo.
export function useReservas(): UseReservasResult {
  const [filtros, setFiltros] = useState<ReservasFiltros>({ equipoId: '', estado: '' })
  const [page, setPage] = useState(0)
  const [data, setData] = useState<PageResponse<Reserva> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let cancelled = false
    listarReservas({
      equipoId: filtros.equipoId === '' ? undefined : filtros.equipoId,
      estado: filtros.estado || undefined,
      page,
      size: RESERVAS_PAGE_SIZE,
    })
      .then((res) => {
        if (!cancelled) {
          setData(res)
          setError(null)
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [filtros.equipoId, filtros.estado, page, intento])

  const cambiarFiltros = useCallback((next: Partial<ReservasFiltros>) => {
    setFiltros((prev) => ({ ...prev, ...next }))
    setPage(0)
    setLoading(true)
    setError(null)
  }, [])

  const limpiarFiltros = useCallback(() => {
    setFiltros({ equipoId: '', estado: '' })
    setPage(0)
    setLoading(true)
    setError(null)
  }, [])

  const cambiarPagina = useCallback((next: number) => {
    setPage(Math.max(next, 0))
    setLoading(true)
    setError(null)
  }, [])

  const reintentar = useCallback(() => {
    setLoading(true)
    setError(null)
    setIntento((n) => n + 1)
  }, [])

  return {
    filtros,
    cambiarFiltros,
    limpiarFiltros,
    cambiarPagina,
    data,
    loading,
    error,
    reintentar,
  }
}
