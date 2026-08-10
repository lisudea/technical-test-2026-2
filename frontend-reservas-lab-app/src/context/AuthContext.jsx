import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { authApi } from '../api'
import { AuthResponseDTO } from '../models/api-error.js'
import { onAuthExpired, setToken, getToken } from '../api/client.js'

const USER_STORAGE_KEY = 'lis.auth.user'

function readStoredUser() {
  try {
    const raw = window.localStorage.getItem(USER_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function persistSession(token, user) {
  setToken(token)
  try {
    if (user) {
      window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
    } else {
      window.localStorage.removeItem(USER_STORAGE_KEY)
    }
  } catch {
    /* almacenamiento no disponible */
  }
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const initialToken = getToken()
  const storedUser = readStoredUser()

  const [token, setTokenState] = useState(initialToken)
  const [user, setUser] = useState(storedUser)
  // true mientras se valida el token guardado contra /auth/me al cargar.
  const [restoring, setRestoring] = useState(Boolean(initialToken))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const applySession = useCallback((authResponse) => {
    const response = authResponse instanceof AuthResponseDTO ? authResponse : AuthResponseDTO.fromJson(authResponse)
    persistSession(response.token, response.user)
    setTokenState(response.token)
    setUser(response.user)
    setError(null)
    return response.user
  }, [])

  const logout = useCallback(() => {
    persistSession(null, null)
    setTokenState(null)
    setUser(null)
    setError(null)
  }, [])

  // Cualquier respuesta 401 del cliente dispara el cierre de sesion global.
  useEffect(() => {
    const unsubscribe = onAuthExpired(() => {
      if (getToken()) {
        logout()
      }
    })
    return unsubscribe
  }, [logout])

  // Al iniciar, si existe un token guardado se valida contra /auth/me.
  useEffect(() => {
    if (!initialToken) {
      return
    }
    let active = true
    authApi
      .fetchProfile()
      .then((profile) => {
        if (!active) return
        setUser(profile)
        persistSession(initialToken, profile)
      })
      .catch(() => {
        if (!active) return
        logout()
      })
      .finally(() => {
        if (active) setRestoring(false)
      })
    return () => {
      active = false
    }
  }, [initialToken, logout])

  const login = useCallback(
    async (credentials) => {
      setBusy(true)
      setError(null)
      try {
        const response = await authApi.login(credentials)
        return applySession(response)
      } catch (err) {
        setError(err)
        throw err
      } finally {
        setBusy(false)
      }
    },
    [applySession],
  )

  const register = useCallback(
    async (payload) => {
      setBusy(true)
      setError(null)
      try {
        const response = await authApi.registerUser(payload)
        return applySession(response)
      } catch (err) {
        setError(err)
        throw err
      } finally {
        setBusy(false)
      }
    },
    [applySession],
  )

  const loginWithGoogle = useCallback(
    async (googleIdToken) => {
      setBusy(true)
      setError(null)
      try {
        const response = await authApi.loginWithGoogle(googleIdToken)
        return applySession(response)
      } catch (err) {
        setError(err)
        throw err
      } finally {
        setBusy(false)
      }
    },
    [applySession],
  )

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      restoring,
      busy,
      error,
      login,
      register,
      loginWithGoogle,
      logout,
    }),
    [token, user, restoring, busy, error, login, register, loginWithGoogle, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  }
  return context
}