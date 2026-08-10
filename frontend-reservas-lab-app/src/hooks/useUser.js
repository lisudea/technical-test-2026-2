import { userApi } from '../api'
import { useLoadable } from './useLoadable.js'
import { usePagination } from './usePagination.js'

/**
 * Listado de usuarios registrados (solo administrador):
 *   GET /api/users?page&size
 */
export function useUsers(initialSize = 10) {
  const pagination = usePagination(initialSize)
  const { page, size } = pagination

  const { data, loading, error, reload } = useLoadable(
    () => userApi.listUsers({ page, size }),
    [page, size],
  )

  return { ...pagination, data, loading, error, reload }
}