/**
 * Contratos de la API (Reto 2). Estos tipos son el espejo exacto de los DTOs
 * y enums de Java: si el backend cambia, TypeScript avisa en compilacion.
 */

// ---------------------------------------------------------------------------
// Enumerados (identicos a equipment_api.entity.*)
// ---------------------------------------------------------------------------

export const EQUIPMENT_CATEGORIES = ['MICROCONTROLLERS', 'VR', 'NETWORKS'] as const
export type EquipmentCategory = (typeof EQUIPMENT_CATEGORIES)[number]

export const EQUIPMENT_STATUSES = ['AVAILABLE', 'RESERVED', 'MAINTENANCE'] as const
export type EquipmentStatus = (typeof EQUIPMENT_STATUSES)[number]

export const RESERVATION_STATUSES = ['ACTIVE', 'CANCELLED'] as const
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number]

// ---------------------------------------------------------------------------
// Paginacion de Spring Data
// ---------------------------------------------------------------------------

/**
 * Spring devuelve mas campos (`pageable`, `sort`, `numberOfElements`...), pero
 * solo declaramos los que la interfaz usa realmente. Los demas se ignoran a
 * proposito para no atarnos a detalles internos del framework.
 */
export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  /** Indice de la pagina actual, empezando en 0. */
  number: number
  size: number
  first: boolean
  last: boolean
}

// ---------------------------------------------------------------------------
// Recursos
// ---------------------------------------------------------------------------

export interface Equipment {
  id: number
  name: string
  /** Numero de serie o direccion MAC. Unico en el sistema. */
  serialNumber: string
  category: EquipmentCategory
  status: EquipmentStatus
  createdAt: string
  updatedAt: string | null
}

/** Cuerpo de POST y PUT /api/equipment. */
export interface EquipmentPayload {
  name: string
  serialNumber: string
  category: EquipmentCategory
  status: EquipmentStatus
}

export interface Reservation {
  id: number
  equipmentId: number
  equipmentName: string
  userId: number
  userName: string
  userEmail: string
  /** ISO local sin zona: "2026-09-01T10:00:00". */
  startTime: string
  endTime: string
  status: ReservationStatus
  createdAt: string | null
}

/**
 * Cuerpo de POST /api/reservations.
 *
 * `userName` y `userEmail` solo hacen falta cuando NO hay sesion iniciada: si
 * se envia un JWT, el backend toma la identidad del token y los ignora.
 */
export interface ReservationPayload {
  equipmentId: number
  startTime: string
  endTime: string
  userName?: string
  userEmail?: string
}

export interface TopEquipment {
  equipmentId: number
  equipmentName: string
  reservationCount: number
}

export interface AuthUser {
  email: string
  name: string
  role: string
}

// ---------------------------------------------------------------------------
// Errores
// ---------------------------------------------------------------------------

/**
 * Codigos de error del backend (ver ErrorCode.java).
 *
 * Existen porque el codigo HTTP no siempre basta: "la franja esta ocupada" y
 * "el equipo esta en mantenimiento" comparten el 409, y la interfaz tiene que
 * mostrar mensajes distintos sin depender del texto, que cambia con el idioma.
 */
export const BACKEND_ERROR_CODES = [
  'RESERVATION_OVERLAP',
  'EQUIPMENT_IN_MAINTENANCE',
  'DUPLICATE_RESOURCE',
  'INVALID_TIME_RANGE',
  'RESERVATION_TOO_LONG',
  'IDENTITY_REQUIRED',
] as const

export type BackendErrorCode = (typeof BACKEND_ERROR_CODES)[number]

/** Contrato unico de error del backend (ver ApiErrorResponse.java). */
export interface ApiErrorBody {
  timestamp?: string
  status?: number
  error?: string
  /** Identificador estable de la situacion. Ver ErrorCode.java. */
  code?: string
  message?: string
  path?: string
  errors?: FieldError[]
  /** Spring Security puede responder con ProblemDetail en vez del contrato propio. */
  detail?: string
}

export interface FieldError {
  field: string
  message: string
}

// ---------------------------------------------------------------------------
// Filtros del listado
// ---------------------------------------------------------------------------

export interface EquipmentFilters {
  category: EquipmentCategory | ''
  status: EquipmentStatus | ''
  /** Busqueda por texto: se aplica en cliente (la API no expone parametro de nombre). */
  search: string
}