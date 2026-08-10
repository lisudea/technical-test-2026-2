import { ApiErrorDTO } from '../models/api-error.js'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '')
const AUTH_TOKEN_KEY = 'lis.auth.token'

export const getToken = () => {
  try {
    return window.localStorage.getItem(AUTH_TOKEN_KEY)
  } catch {
    return null
  }
}

export const setToken = (token) => {
  try {
    if (token) {
      window.localStorage.setItem(AUTH_TOKEN_KEY, token)
    } else {
      window.localStorage.removeItem(AUTH_TOKEN_KEY)
    }
  } catch {
    /* almacenamiento no disponible */
  }
}

const AUTH_EXPIRED_EVENT = 'lis:auth-expired'

/**
 * Permite notificar globalmente cuando el token deja de ser valido
 * (el AuthContext se suscribe para cerrar la sesion).
 */
export const onAuthExpired = (handler) => {
  const listener = () => handler()
  window.addEventListener(AUTH_EXPIRED_EVENT, listener)
  return () => window.removeEventListener(AUTH_EXPIRED_EVENT, listener)
}

const emitAuthExpired = () => {
  window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT))
}

/**
 * Cliente HTTP generico.
 *
 * - Agrega el encabezado Authorization Bearer si hay token (salvo skipAuth).
 * - Serializa cuerpos JSON o en texto plano (p. ej. el idToken de Google).
 * - Normaliza los errores del backend (ApiErrorDTO) lanzando excepciones.
 * - Los recursos HATEOAS (EntityModel / PagedModel) se parsean en los modulos
 *   de API correspondientes con los modelos de la capa de datos.
 *
 * @returns {Promise<any|null>} JSON de la respuesta, o null en 204.
 */
export async function httpRequest(path, options = {}) {
  const {
    method = 'GET',
    body = null,
    rawBody = null,
    headers = {},
    skipAuth = false,
  } = options

  const url = `${API_BASE_URL}${path}`

  const finalHeaders = { ...headers }
  if (!skipAuth) {
    const token = getToken()
    if (token) {
      finalHeaders.Authorization = `Bearer ${token}`
    }
  }

  let payload = null
  if (rawBody != null) {
    finalHeaders['Content-Type'] = headers['Content-Type'] ?? 'text/plain'
    payload = rawBody
  } else if (body != null) {
    finalHeaders['Content-Type'] = headers['Content-Type'] ?? 'application/json'
    payload = JSON.stringify(body)
  }

  let response
  try {
    response = await fetch(url, {
      method,
      headers: finalHeaders,
      body: payload,
    })
  } catch (networkError) {
    throw new ApiErrorDTO({
      status: 0,
      message:
        'No fue posible conectarse con el servidor. Verifica que el backend esté disponible.',
      error: 'NetworkError',
      data: networkError,
    })
  }

  if (response.status === 204) {
    return null
  }

  let json = null
  const contentType = response.headers.get('content-type') ?? ''
  // El backend HATEOAS responde con "application/hal+json" en equipos y reservas,
  // por lo que se detecta cualquier tipo que contenga "json".
  if (contentType.includes('json')) {
    try {
      json = await response.json()
    } catch {
      json = null
    }
  }

  if (!response.ok) {
    if (response.status === 401 && !skipAuth) {
      // El token expiro o es invalido: la sesion debe cerrarse.
      emitAuthExpired()
    }

    if (json && json.message) {
      throw ApiErrorDTO.fromJson(json)
    }

    throw new ApiErrorDTO({
      status: response.status,
      message: `El servidor respondio con un estado inesperado (${response.status})`,
      error: response.statusText,
    })
  }

  return json
}