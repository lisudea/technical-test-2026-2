import { useCallback, useEffect, useState } from 'react'
import { listarEquipos } from '../api/equipos'
import type { CategoriaEquipo, Equipo, EstadoEquipo, PageResponse } from '../api/types'

// Este archivo contiene un hook personalizado llamado useEquipos que se utiliza para manejar la lógica de filtrado, paginación y
// manejo de errores al listar equipos desde la API. El hook devuelve un objeto con los filtros actuales, la página actual, los datos
// de los equipos, el estado de carga y error, y funciones para cambiar filtros, limpiar filtros, cambiar página y reintentar la
// solicitud en caso de error.
export const PAGE_SIZE = 8

// Los tipos FiltroCategoria y FiltroEstado representan los posibles valores de los filtros de categoría y estado de los equipos.
export type FiltroCategoria = CategoriaEquipo | ''
export type FiltroEstado = EstadoEquipo | ''

// La interfaz EquiposFiltros representa los filtros actuales de categoría y estado de los equipos.
export interface EquiposFiltros {
  categoria: FiltroCategoria
  estado: FiltroEstado
}

// La interfaz UseEquiposResult representa el objeto devuelto por el hook useEquipos. Contiene los filtros actuales, la página
// actual, los datos de los equipos, el estado de carga y error, y funciones para cambiar filtros, limpiar filtros, cambiar página
// y reintentar la solicitud en caso de error.
export interface UseEquiposResult {
  filtros: EquiposFiltros
  cambiarFiltros: (next: Partial<EquiposFiltros>) => void
  limpiarFiltros: () => void
  page: number
  cambiarPagina: (page: number) => void
  data: PageResponse<Equipo> | null
  loading: boolean
  error: unknown
  reintentar: () => void
}

// El hook useEquipos maneja la lógica de filtrado, paginación y manejo de errores al listar equipos desde la API. Utiliza useState
// para manejar el estado de los filtros, la página actual, los datos de los equipos, el estado de carga y error, y un contador 
// de intentos para reintentar la solicitud en caso de error.
export function useEquipos(): UseEquiposResult {
  const [filtros, setFiltros] = useState<EquiposFiltros>({ categoria: '', estado: '' })
  const [page, setPage] = useState(0)
  const [data, setData] = useState<PageResponse<Equipo> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let cancelled = false
    listarEquipos({
      categoria: filtros.categoria || undefined,
      estado: filtros.estado || undefined,
      page,
      size: PAGE_SIZE,
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
  }, [filtros.categoria, filtros.estado, page, intento])

  const cambiarFiltros = useCallback((next: Partial<EquiposFiltros>) => {
    setFiltros((prev) => ({ ...prev, ...next }))
    setPage(0)
    setLoading(true)
    setError(null)
  }, [])

  const limpiarFiltros = useCallback(() => {
    setFiltros({ categoria: '', estado: '' })
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
    page,
    cambiarPagina,
    data,
    loading,
    error,
    reintentar,
  }
}
