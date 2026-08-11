import { API_BASE_URL } from '../config/env'
import { request } from './http'
import type { AuthUser } from '../types/api'

/**
 * URL que inicia el SSO de Google (bonus del Reto 2).
 *
 * Es una navegacion del navegador, no un fetch: el flujo OAuth2 implica
 * redirecciones a Google y de vuelta. Al terminar, el backend redirige a
 * `${app.frontend.redirect-uri}?token=<jwt>`, que apunta a /auth/callback.
 *
 * Solo se aceptan cuentas @udea.edu.co; el backend rechaza las demas.
 */
export function googleLoginUrl(): string {
  return `${API_BASE_URL}/oauth2/authorization/google`
}

/** GET /api/auth/me - requiere un JWT valido. Devuelve 401 si caduco. */
export function fetchCurrentUser(signal?: AbortSignal): Promise<AuthUser> {
  return request<AuthUser>('/api/auth/me', { auth: true, signal })
}