import { useCallback, useState } from 'react'

/**
 * Estado compartido para listas paginadas (mobile-first: la mayor parte de las
 * interacciones usan "cargar mas"/paginas simples).
 */
export function usePagination(initialSize = 10) {
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(initialSize)

  const reset = useCallback(() => setPage(0), [])
  const next = useCallback(() => setPage((p) => p + 1), [])
  const prev = useCallback((p) => (p > 0 ? setPage((p) => p - 1) : undefined), [])

  return { page, size, setPage, setSize, reset, next, prev }
}