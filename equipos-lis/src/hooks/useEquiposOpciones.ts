import { useEffect, useState } from 'react'
import { listarEquipos } from '../api/equipos'
import type { Equipo } from '../api/types'

// Este archivo contiene un hook personalizado llamado useEquiposOpciones que se utiliza para cargar la lista de
// equipos disponibles para componentes como selectores o formularios, manejando el estado de carga durante la
// solicitud a la API.

// La interfaz UseEquiposOpcionesResult representa el objeto devuelto por el hook useEquiposOpciones.
// Contiene la lista de equipos disponibles y el estado de carga de la solicitud.
export interface UseEquiposOpcionesResult {
  equipos: Equipo[]
  cargando: boolean
}

// El hook useEquiposOpciones obtiene la lista de equipos disponibles para su uso en interfaces que requieren
// opciones de selección. Consulta la API una sola vez al montarse y actualiza el estado local con los resultados.
export function useEquiposOpciones(): UseEquiposOpcionesResult {
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let cancelled = false
    listarEquipos({ page: 0, size: 100 })
      .then((res) => {
        if (!cancelled) setEquipos(res.contenido)
      })
      .catch(() => {
        if (!cancelled) setEquipos([])
      })
      .finally(() => {
        if (!cancelled) setCargando(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { equipos, cargando }
}
