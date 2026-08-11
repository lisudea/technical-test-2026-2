import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { fetchCurrentUser, googleLoginUrl } from '../api/auth'
import { ApiError, clearToken, getToken, setToken } from '../api/http'
import { STORAGE_KEYS } from '../config/env'
import type { AuthUser } from '../types/api'

/** Identidad usada para reservar cuando no hay sesion iniciada. */
export interface GuestIdentity {
  name: string
  email: string
}

export interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  /** Identidad de invitado recordada del ultimo formulario de reserva. */
  guest: GuestIdentity | null
  saveGuest: (guest: GuestIdentity) => void
  login: () => void
  logout: () => void
  /** Guarda el token recibido en /auth/callback y carga el perfil. */
  completeLogin: (token: string) => Promise<void>
  /**
   * Correo con el que actuar: el de la sesion si existe, si no el de invitado.
   * Lo usan las reservas y las cancelaciones.
   */
  effectiveEmail: string | null
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | null>(null)

function readGuest(): GuestIdentity | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.guest)
    return raw ? (JSON.parse(raw) as GuestIdentity) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState<boolean>(() => Boolean(getToken()))
  const [guest, setGuest] = useState<GuestIdentity | null>(readGuest)

  /**
   * Al arrancar, si hay un token guardado se valida contra /api/auth/me.
   * El JWT dura 1 hora, asi que al volver a abrir la aplicacion puede estar
   * caducado; en ese caso se descarta en silencio y se sigue como anonimo.
   */
  useEffect(() => {
    const token = getToken()

    if (!token) {
      setLoading(false)
      return
    }

    const controller = new AbortController()

    fetchCurrentUser(controller.signal)
      .then(setUser)
      .catch((error) => {
        if (error instanceof ApiError && error.code === 'UNAUTHORIZED') {
          clearToken()
          setUser(null)
        }
        // Un fallo de red no invalida la sesion: puede ser que el backend
        // este apagado, y el token seguira sirviendo cuando vuelva.
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [])

  const login = useCallback(() => {
    // Navegacion completa: el flujo OAuth2 sale del dominio y vuelve.
    window.location.href = googleLoginUrl()
  }, [])

  const logout = useCallback(() => {
    clearToken()
    setUser(null)
  }, [])

  const completeLogin = useCallback(async (token: string) => {
    setToken(token)
    setLoading(true)

    try {
      setUser(await fetchCurrentUser())
    } finally {
      setLoading(false)
    }
  }, [])

  const saveGuest = useCallback((identity: GuestIdentity) => {
    setGuest(identity)
    localStorage.setItem(STORAGE_KEYS.guest, JSON.stringify(identity))
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      guest,
      saveGuest,
      login,
      logout,
      completeLogin,
      effectiveEmail: user?.email ?? guest?.email ?? null,
    }),
    [user, loading, guest, saveGuest, login, logout, completeLogin],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}