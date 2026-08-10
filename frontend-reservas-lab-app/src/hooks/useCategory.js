import { useCallback, useState } from 'react'
import { categoryApi } from '../api'
import { useLoadable } from './useLoadable.js'

/**
 * Categorias de equipos (lista completa sin paginar) y creacion de
 * categorias nuevas para el administrador:
 *   GET /api/categories | POST /api/categories
 */
export function useCategories() {
  const { data, loading, error, reload } = useLoadable(() => categoryApi.listCategories(), [])
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState(null)

  const create = useCallback(
    async (categoryName) => {
      setCreating(true)
      setCreateError(null)
      try {
        const created = await categoryApi.createCategory({ categoryName })
        reload()
        return created
      } catch (err) {
        setCreateError(err)
        throw err
      } finally {
        setCreating(false)
      }
    },
    [reload],
  )

  return { data, loading, error, reload, create, creating, createError }
}