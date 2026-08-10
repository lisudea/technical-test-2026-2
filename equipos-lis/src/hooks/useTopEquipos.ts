import { useCallback, useEffect, useState } from 'react'
import { top5Equipos } from '../api/estadisticas'
import type { TopEquipo } from '../api/types'

// Este archivo contiene un hook personalizado llamado useTopEquipos que se utiliza para consultar el Top 5 de equipos
// más solicitados desde la API y exponer su estado de carga, datos y posibles errores.

// La interfaz UseTopEquiposResult representa el objeto devuelto por el hook useTopEquipos. Contiene los datos del
// Top 5, el estado de carga, el error de la solicitud y una función para reintentar la consulta.
export interface UseTopEquiposResult {
  data: TopEquipo[] | null
  loading: boolean
  error: unknown
  reintentar: () => void
}

// El hook useTopEquipos realiza la solicitud al endpoint de estadísticas al montarse y actualiza el estado local con
// los resultados obtenidos. También ofrece una función para reintentar la consulta si ocurre un error.
export function useTopEquipos(): UseTopEquiposResult {
  const [data, setData] = useState<TopEquipo[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let cancelled = false
    top5Equipos()
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
  }, [intento])

  const reintentar = useCallback(() => {
    setLoading(true)
    setError(null)
    setIntento((n) => n + 1)
  }, [])

  return { data, loading, error, reintentar }
}
