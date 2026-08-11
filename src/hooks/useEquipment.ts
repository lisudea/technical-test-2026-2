import { useCallback, useEffect, useMemo, useState } from 'react'

import { client } from '../api/client'
import { DEFAULT_PAGE_SIZE } from '../config/env'
import { isAbortError, toDisplayableError } from '../utils/errors'
import { useDebouncedValue } from './useDebouncedValue'
import type { DisplayableError } from '../utils/errors'
import type { Equipment, EquipmentFilters, Page } from '../types/api'

const EMPTY_FILTERS: EquipmentFilters = { category: '', status: '', search: '' }

export interface UseEquipmentResult {
  /** Equipos de la pagina actual, ya filtrados por el buscador de texto. */
  items: Equipment[]
  page: Page<Equipment> | null
  filters: EquipmentFilters
  setFilter: <K extends keyof EquipmentFilters>(key: K, value: EquipmentFilters[K]) => void
  clearFilters: () => void
  pageNumber: number
  setPageNumber: (page: number) => void
  size: number
  setSize: (size: number) => void
  loading: boolean
  error: DisplayableError | null
  /** Fuerza una recarga (tras crear o editar, o al reintentar la conexion). */
  refresh: () => void
}

/**
 * Estado del listado de equipos: filtros, paginacion, carga y errores.
 *
 * Los filtros de categoria y estado se envian al backend; la busqueda por
 * texto se aplica en cliente sobre la pagina cargada, porque la API no tiene
 * parametro de nombre.
 */
export function useEquipment(): UseEquipmentResult {
  const [filters, setFilters] = useState<EquipmentFilters>(EMPTY_FILTERS)
  const [pageNumber, setPageNumber] = useState(0)
  const [size, setSize] = useState<number>(DEFAULT_PAGE_SIZE)
  const [page, setPage] = useState<Page<Equipment> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<DisplayableError | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  const debouncedSearch = useDebouncedValue(filters.search, 300)

  const setFilter = useCallback(
    <K extends keyof EquipmentFilters>(key: K, value: EquipmentFilters[K]) => {
      setFilters((current) => ({ ...current, [key]: value }))
      // Cambiar un filtro reinicia la paginacion: si el usuario estaba en la
      // pagina 3 y filtra por VR, la 3 probablemente ya no exista.
      setPageNumber(0)
    },
    [],
  )

  const clearFilters = useCallback(() => {
    setFilters(EMPTY_FILTERS)
    setPageNumber(0)
  }, [])

  const refresh = useCallback(() => setReloadToken((token) => token + 1), [])

  useEffect(() => {
    // Cancela la peticion anterior al cambiar de filtro rapido, para que una
    // respuesta lenta no pise a otra mas reciente.
    const controller = new AbortController()

    setLoading(true)
    setError(null)

    client
      .fetchEquipment({
        category: filters.category,
        status: filters.status,
        page: pageNumber,
        size,
        signal: controller.signal,
      })
      .then((result) => {
        setPage(result)
        setLoading(false)
      })
      .catch((caught) => {
        if (isAbortError(caught)) return
        setError(toDisplayableError(caught))
        setLoading(false)
      })

    return () => controller.abort()
  }, [filters.category, filters.status, pageNumber, size, reloadToken])

  // Busqueda por texto en cliente, sobre nombre y numero de serie.
  const items = useMemo(() => {
    const all = page?.content ?? []
    const term = debouncedSearch.trim().toLowerCase()

    if (!term) return all

    return all.filter(
      (equipment) =>
        equipment.name.toLowerCase().includes(term) ||
        equipment.serialNumber.toLowerCase().includes(term),
    )
  }, [page, debouncedSearch])

  return {
    items,
    page,
    filters,
    setFilter,
    clearFilters,
    pageNumber,
    setPageNumber,
    size,
    setSize,
    loading,
    error,
    refresh,
  }
}