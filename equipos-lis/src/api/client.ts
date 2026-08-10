import type { ApiErrorBody, CampoError } from './types'
// Este archivo contiene funciones y clases para realizar peticiones HTTP a la API y manejar errores de manera consistente.

// La constante API_BASE_URL se obtiene de la variable de entorno VITE_API_URL, y si no está definida, se utiliza un 
// valor por defecto.
const API_BASE_URL: string =
  (import.meta.env?.VITE_API_URL as string | undefined) ?? 'http://localhost:8080/api'

const REQUEST_TIMEOUT_MS = 15000

// La interfaz ApiErrorOptions define las opciones que se pueden pasar al constructor de la clase ApiError.
export interface ApiErrorOptions {
  status: number
  message: string
  error?: string
  path?: string
  timestamp?: string
  errors?: CampoError[]
  isNetworkError?: boolean
}

// La clase ApiError extiende la clase Error y representa un error de la API. Contiene información adicional sobre el error, 
// como el código de estado HTTP, el mensaje de error, la ruta de la solicitud, la marca de tiempo y los errores de campo.
export class ApiError extends Error {
  readonly status: number
  readonly error: string | undefined
  readonly path: string | undefined
  readonly timestamp: string | undefined
  readonly errors: CampoError[] | undefined
  readonly isNetworkError: boolean

  constructor(options: ApiErrorOptions) {
    super(options.message)
    this.name = 'ApiError'
    this.status = options.status
    this.error = options.error
    this.path = options.path
    this.timestamp = options.timestamp
    this.errors = options.errors
    this.isNetworkError = options.isNetworkError ?? false
  }
}

// La función buildQuery construye una cadena de consulta a partir de un objeto de parámetros. Se omiten los parámetros 
// con valores undefined o vacíos. Es para ser utilizada en las solicitudes GET a la API. Por ejemplo, si se pasa
//  { page: 1, size: 10 }, la función devolverá "?page=1&size=10".
export function buildQuery(params: object): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      search.set(key, String(value))
    }
  }
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

// La función request realiza una solicitud HTTP a la API y devuelve la respuesta como un objeto del tipo genérico T.
// Si la respuesta no es exitosa, lanza un ApiError con información sobre el error. Si ocurre un error de red, también se lanza
//  un ApiError.
export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(init.body ? { 'Content-Type': 'application/json' } : {}),
  }

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
      signal: controller.signal,
    })
  } catch {
    throw new ApiError({
      status: 0,
      message: '',
      isNetworkError: true,
    })
  } finally {
    clearTimeout(timeout)
  }

  const text = await response.text()
  let body: unknown
  try {
    body = text ? JSON.parse(text) : undefined
  } catch {
    body = undefined
  }

  if (!response.ok) {
    const api = body as ApiErrorBody | undefined
    throw new ApiError({
      status: response.status,
      message: api?.message ?? `HTTP ${response.status}`,
      error: api?.error,
      path: api?.path,
      timestamp: api?.timestamp,
      errors: api?.errors,
    })
  }

  return body as T
}

// La función isApiError verifica si un error es una instancia de ApiError. Esto permite diferenciar entre errores de la API
// y otros tipos de errores.
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

// La función getErrorMessage devuelve un mensaje de error legible para el usuario a partir de un error desconocido. 
// Si el error es de tipo ApiError, se devuelve el mensaje correspondiente. Si no lo es, se devuelve el mensaje de fallback.
export function getErrorMessage(error: unknown, networkFallback: string): string {
  if (error instanceof ApiError) {
    if (error.isNetworkError) return networkFallback
    if (error.message) return error.message
    return `HTTP ${error.status}`
  }
  return networkFallback
}

// La función getFieldErrors devuelve un arreglo de errores de campo a partir de un error desconocido. Si el error es de tipo
// ApiError y contiene errores de campo, se devuelven esos errores. Si no, se devuelve un arreglo vacío.
export function getFieldErrors(error: unknown): CampoError[] {
  return error instanceof ApiError ? (error.errors ?? []) : []
}
