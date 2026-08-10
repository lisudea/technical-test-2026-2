import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { alCambiarSesion, guardarSesion, obtenerSesion, reiniciarAuth } from '../api/cliente'
import { auth } from '../api/servicios'
import type { Sesion, Usuario } from '../api/tipos'

interface ContextoAuth {
  usuario: Usuario | null
  iniciarSesion: (sesion: Sesion) => void
  cerrarSesion: () => void
}

const Contexto = createContext<ContextoAuth>({
  usuario: null,
  iniciarSesion: () => {},
  cerrarSesion: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [usuario, setUsuario] = useState<Usuario | null>(() => obtenerSesion()?.usuario ?? null)

  useEffect(() => alCambiarSesion((sesion) => setUsuario(sesion?.usuario ?? null)), [])

  const iniciarSesion = (sesion: Sesion) => {
    reiniciarAuth()
    guardarSesion(sesion)
    queryClient.clear()
  }

  const cerrarSesion = () => {
    const sesion = obtenerSesion()
    if (sesion) auth.logout(sesion.refreshToken).catch(() => {})
    reiniciarAuth()
    guardarSesion(null)
    queryClient.clear()
  }

  return (
    <Contexto.Provider value={{ usuario, iniciarSesion, cerrarSesion }}>
      {children}
    </Contexto.Provider>
  )
}

export function useAuth() {
  return useContext(Contexto)
}
