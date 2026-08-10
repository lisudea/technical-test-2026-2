import type { ApiErrorBody } from '@/types/common'

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

/**
 * Typed error thrown for every non-2xx response from the backend.
 * Wraps the Spring Boot error body so UI code can show
 * `error.message` directly as a friendly, backend-provided alert.
 */
export class ApiError extends Error {
  readonly status: number
  readonly error: string
  readonly path: string
  readonly timestamp: string

  constructor(body: ApiErrorBody) {
    super(body.message)
    this.name = 'ApiError'
    this.status = body.status
    this.error = body.error
    this.path = body.path
    this.timestamp = body.timestamp
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  searchParams?: Record<string, string | number | boolean | undefined | null>
}

function buildUrl(path: string, searchParams?: RequestOptions['searchParams']) {
  const url = new URL(path.startsWith('http') ? path : `${API_BASE_URL}${path}`)
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value))
      }
    }
  }
  return url.toString()
}

/**
 * Thin fetch wrapper used by every resource module in `lib/api`.
 * - Serializes JSON bodies automatically.
 * - Normalizes query params.
 * - Converts non-2xx responses into `ApiError` using the backend's
 *   documented error schema, falling back to a generic message if
 *   the body can't be parsed (e.g. network error, backend offline).
 */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, searchParams, headers, ...rest } = options

  let response: Response
  try {
    response = await fetch(buildUrl(path, searchParams), {
      ...rest,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    })
  } catch {
    throw new ApiError({
      timestamp: new Date().toISOString(),
      status: 0,
      error: 'Network Error',
      message: 'No se pudo conectar con el servidor. Verifica que el backend esté disponible en ' + API_BASE_URL,
      path,
    })
  }

  if (!response.ok) {
    let errorBody: ApiErrorBody
    try {
      errorBody = await response.json()
    } catch {
      errorBody = {
        timestamp: new Date().toISOString(),
        status: response.status,
        error: response.statusText || 'Error',
        message: 'Ocurrió un error inesperado al comunicarse con el servidor.',
        path,
      }
    }
    throw new ApiError(errorBody)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
