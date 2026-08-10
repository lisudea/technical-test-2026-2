import { useCallback, useEffect, useState } from 'react'
import { equipmentApi } from '../api'
import { usePagination } from './usePagination.js'

const EMPTY_PAGE = {
  content: [],
  metadata: { size: 10, number: 0, totalElements: 0, totalPages: 0 },
  hasItems: false,
}

/**
 * Consulta de equipos con filtros y paginacion (todo desde el backend):
 *   GET /api/equipment?page&size&categoryId&status
 */
export function useEquipment(initialSize = 10) {
  const pagination = usePagination(initialSize)
  const [filters, setFiltersState] = useState({ categoryId: null, status: '' })
  const [data, setData] = useState(EMPTY_PAGE)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [nonce, setNonce] = useState(0)

  const reload = useCallback(() => setNonce((n) => n + 1), [])

  const setFilters = useCallback(
    (update) => {
      setFiltersState((prev) => ({ ...prev, ...update }))
      pagination.reset()
    },
    [pagination],
  )

  const { page, size } = pagination

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    equipmentApi
      .listEquipment({
        page,
        size,
        categoryId: filters.categoryId || null,
        status: filters.status || null,
      })
      .then((result) => {
        if (!cancelled) setData(result)
      })
      .catch((err) => {
        if (!cancelled) setError(err)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [page, size, filters.categoryId, filters.status, nonce])

  const create = useCallback(async (payload) => {
    const created = await equipmentApi.createEquipment(payload)
    return created
  }, [])

  const update = useCallback(async (id, payload) => {
    const updated = await equipmentApi.updateEquipment(id, payload)
    return updated
  }, [])

  const remove = useCallback(async (id) => {
    await equipmentApi.deleteEquipment(id)
  }, [])

  return {
    ...pagination,
    filters,
    setFilters,
    data,
    loading,
    error,
    reload,
    create,
    update,
    remove,
  }
}