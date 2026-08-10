import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Hook base que ejecuta una funcion asincrona de la capa de API y expone
 * { data, loading, error, reload }. Re-ejecuta cuando cambian las dependencias.
 */
export function useLoadable(loader, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [nonce, setNonce] = useState(0)
  const cancelRef = useRef(false)

  const reload = useCallback(() => setNonce((n) => n + 1), [])

  useEffect(() => {
    cancelRef.current = false
    setLoading(true)
    setError(null)

    Promise.resolve()
      .then(() => loader())
      .then((result) => {
        if (!cancelRef.current) setData(result)
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
  }, [nonce, ...deps]) // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error, reload }
}