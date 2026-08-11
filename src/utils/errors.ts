import { ApiError } from '../api/http'
import type { ApiErrorCode } from '../api/http'
import type { TranslationKey } from '../i18n/types'

/**
 * Traduce cualquier error a un par de claves i18n listas para mostrar.
 *
 * Cumple el requisito 6 del Reto 3: capturar los errores del backend
 * (especialmente el 409 al reservar un equipo ya ocupado) y presentarlos al
 * usuario con un mensaje amigable en lugar de un codigo o un volcado tecnico.
 */
export interface DisplayableError {
  code: ApiErrorCode
  titleKey: TranslationKey
  bodyKey: TranslationKey
  /** Mensaje literal del backend, si lo hubo. Se muestra como detalle secundario. */
  detail: string | null
  /** Errores campo a campo para resaltarlos en los formularios. */
  fieldErrors: { field: string; message: string }[]
}

const TITLE_KEYS: Record<ApiErrorCode, TranslationKey> = {
  CONFLICT: 'errors.CONFLICT.title',
  VALIDATION: 'errors.VALIDATION.title',
  UNAUTHORIZED: 'errors.UNAUTHORIZED.title',
  FORBIDDEN: 'errors.FORBIDDEN.title',
  NOT_FOUND: 'errors.NOT_FOUND.title',
  NETWORK: 'errors.NETWORK.title',
  SERVER: 'errors.SERVER.title',
  UNKNOWN: 'errors.UNKNOWN.title',
}

const BODY_KEYS: Record<ApiErrorCode, TranslationKey> = {
  CONFLICT: 'errors.CONFLICT.body',
  VALIDATION: 'errors.VALIDATION.body',
  UNAUTHORIZED: 'errors.UNAUTHORIZED.body',
  FORBIDDEN: 'errors.FORBIDDEN.body',
  NOT_FOUND: 'errors.NOT_FOUND.body',
  NETWORK: 'errors.NETWORK.body',
  SERVER: 'errors.SERVER.body',
  UNKNOWN: 'errors.UNKNOWN.body',
}

/**
 * Mensajes especificos por codigo de negocio del backend.
 *
 * Tienen prioridad sobre el mapeo por codigo HTTP. Sin esto, un equipo en
 * mantenimiento mostraria "Franja horaria ocupada", porque ambas situaciones
 * comparten el 409.
 */
const BACKEND_CODE_KEYS: Record<string, { title: TranslationKey; body: TranslationKey }> = {
  RESERVATION_OVERLAP: { title: 'errors.CONFLICT.title', body: 'errors.CONFLICT.body' },
  EQUIPMENT_IN_MAINTENANCE: {
    title: 'errors.EQUIPMENT_IN_MAINTENANCE.title',
    body: 'errors.EQUIPMENT_IN_MAINTENANCE.body',
  },
  DUPLICATE_RESOURCE: {
    title: 'errors.DUPLICATE_RESOURCE.title',
    body: 'errors.DUPLICATE_RESOURCE.body',
  },
  INVALID_TIME_RANGE: {
    title: 'errors.INVALID_TIME_RANGE.title',
    body: 'errors.INVALID_TIME_RANGE.body',
  },
  RESERVATION_TOO_LONG: {
    title: 'errors.RESERVATION_TOO_LONG.title',
    body: 'errors.RESERVATION_TOO_LONG.body',
  },
  IDENTITY_REQUIRED: {
    title: 'errors.IDENTITY_REQUIRED.title',
    body: 'errors.IDENTITY_REQUIRED.body',
  },
}

export function toDisplayableError(error: unknown): DisplayableError {
  if (error instanceof ApiError) {
    // Se prefiere el codigo de negocio cuando el backend lo envia; si no,
    // se cae al mapeo generico por codigo HTTP.
    const especifico = error.backendCode ? BACKEND_CODE_KEYS[error.backendCode] : undefined

    return {
      code: error.code,
      titleKey: especifico?.title ?? TITLE_KEYS[error.code],
      bodyKey: especifico?.body ?? BODY_KEYS[error.code],
      detail: error.backendMessage,
      fieldErrors: error.fieldErrors,
    }
  }

  return {
    code: 'UNKNOWN',
    titleKey: TITLE_KEYS.UNKNOWN,
    bodyKey: BODY_KEYS.UNKNOWN,
    detail: error instanceof Error ? error.message : null,
    fieldErrors: [],
  }
}

/** Una peticion cancelada por AbortController no es un error que mostrar. */
export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}