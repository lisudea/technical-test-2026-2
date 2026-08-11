import { API_BASE_URL, STORAGE_KEYS } from '../config/env'
import type { ApiErrorBody, FieldError } from '../types/api'

/**
 * Categorias de error que la interfaz sabe traducir. Se derivan del codigo
 * HTTP, de modo que los componentes nunca comparan numeros sueltos.
 */
export type ApiErrorCode =
  | 'NETWORK'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VALIDATION'
  | 'SERVER'
  | 'UNKNOWN'

export class ApiError extends Error {
  readonly status: number
  /** Categoria derivada del codigo HTTP. */
  readonly code: ApiErrorCode
  /**
   * Codigo especifico del backend (`RESERVATION_OVERLAP`,
   * `EQUIPMENT_IN_MAINTENANCE`…), cuando lo envia. Permite distinguir dos
   * situaciones que comparten codigo HTTP.
   */
  readonly backendCode: string | null
  /** Mensaje literal devuelto por el backend, o null si no vino ninguno. */
  readonly backendMessage: string | null
  /** Errores campo a campo de las validaciones (@Valid). */
  readonly fieldErrors: FieldError[]

  constructor(
    status: number,
    code: ApiErrorCode,
    backendMessage: string | null,
    fieldErrors: FieldError[] = [],
    backendCode: string | null = null,
  ) {
    super(backendMessage ?? code)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.backendCode = backendCode
    this.backendMessage = backendMessage
    this.fieldErrors = fieldErrors
  }
}

function codeFromStatus(status: number): ApiErrorCode {
  if (status === 401) return 'UNAUTHORIZED'
  if (status === 403) return 'FORBIDDEN'
  if (status === 404) return 'NOT_FOUND'
  if (status === 409) return 'CONFLICT'
  if (status === 400 || status === 422) return 'VALIDATION'
  if (status >= 500) return 'SERVER'
  return 'UNKNOWN'
}

export function getToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.token)
}

export function setToken(token: string): void {
  localStorage.setItem(STORAGE_KEYS.token, token)
}

export function clearToken(): void {
  localStorage.removeItem(STORAGE_KEYS.token)
}

type QueryValue = string | number | boolean | undefined | null

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  query?: Record<string, QueryValue>
  body?: unknown
  /** Adjunta el JWT si existe. Nunca falla por no tenerlo. */
  auth?: boolean
  signal?: AbortSignal
}

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const url = `${API_BASE_URL}${path}`

  if (!query) return url

  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(query)) {
    // Se omiten los filtros vacios en lugar de mandar "category=":
    // asi la URL refleja exactamente los filtros activos.
    if (value === undefined || value === null || value === '') continue
    params.append(key, String(value))
  }

  const qs = params.toString()
  return qs ? `${url}?${qs}` : url
}

/**
 * Intenta extraer un mensaje legible del cuerpo del error.
 *
 * Es deliberadamente defensivo: Spring Security devuelve 401 y 403 con el
 * cuerpo VACIO, y algunas respuestas usan el formato ProblemDetail (`detail`)
 * en lugar del contrato propio de la API (`message`).
 *
 * `looksLikeApi` indica si la respuesta es creible como respuesta de nuestra
 * API: cuerpo vacio (tipico de Spring Security) o JSON valido. Un cuerpo HTML
 * delata que en ese puerto hay otro servicio.
 */
async function parseErrorBody(response: Response): Promise<{
  message: string | null
  backendCode: string | null
  fieldErrors: FieldError[]
  looksLikeApi: boolean
  hasBody: boolean
}> {
  const vacio = {
    message: null,
    backendCode: null,
    fieldErrors: [] as FieldError[],
    looksLikeApi: true,
    hasBody: false,
  }

  let text: string

  try {
    text = await response.text()
  } catch {
    return vacio
  }

  if (!text.trim()) return vacio

  try {
    const body = JSON.parse(text) as ApiErrorBody

    return {
      message: body.message ?? body.detail ?? body.error ?? null,
      backendCode: body.code ?? null,
      fieldErrors: Array.isArray(body.errors) ? body.errors : [],
      looksLikeApi: true,
      hasBody: true,
    }
  } catch {
    return { ...vacio, looksLikeApi: false, hasBody: true }
  }
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', query, body, auth = false, signal } = options

  const headers: Record<string, string> = { Accept: 'application/json' }

  if (body !== undefined) headers['Content-Type'] = 'application/json'

  if (auth) {
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let response: Response

  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    })
  } catch (error) {
    // Una peticion abortada no es un fallo: la relanzamos tal cual para que
    // el hook que la cancelo la reconozca y no muestre ningun error.
    if (error instanceof DOMException && error.name === 'AbortError') throw error

    // fetch solo lanza cuando la red falla o el servidor no responde.
    throw new ApiError(0, 'NETWORK', null)
  }

  if (!response.ok) {
    const { message, backendCode, fieldErrors, looksLikeApi, hasBody } =
      await parseErrorBody(response)

    // Un cuerpo que no es JSON significa que quien contesta en ese puerto no
    // es nuestra API (otro servidor ocupando el 8080, una pagina de error de
    // un proxy, un portal cautivo...). Se trata como fallo de conexion para
    // que la interfaz lo diga claramente en lugar de inventar un 404 o un 500.
    if (!looksLikeApi) {
      throw new ApiError(0, 'NETWORK', null)
    }

    // Un 404 SIN cuerpo tampoco puede venir de nuestra API: su
    // GlobalExceptionHandler responde siempre con un JSON de error, incluso
    // para rutas inexistentes. Asi que significa lo mismo: ahi no esta la API.
    // (401 y 403 sin cuerpo si son legitimos: los produce Spring Security.)
    if (response.status === 404 && !hasBody) {
      throw new ApiError(0, 'NETWORK', null)
    }

    throw new ApiError(
      response.status,
      codeFromStatus(response.status),
      message,
      fieldErrors,
      backendCode,
    )
  }

  // 204 No Content (cancelar reserva) y cualquier respuesta sin cuerpo.
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return undefined as T
  }

  const text = await response.text()

  if (!text) return undefined as T

  try {
    return JSON.parse(text) as T
  } catch {
    // Respuesta 200 que no es JSON: de nuevo, no estamos hablando con la API.
    throw new ApiError(0, 'NETWORK', null)
  }
}