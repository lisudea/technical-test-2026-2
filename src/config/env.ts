/**
 * Configuracion tomada de las variables de entorno de Vite (prefijo VITE_).
 * Ver .env.example.
 */

/**
 * Base de las llamadas a la API.
 *
 * Vacia por defecto: las URLs quedan relativas ("/api/equipment") y las
 * atiende el proxy de Vite, que reenvia a localhost:8080. Como el navegador ve
 * el mismo origen, no hay CORS ni preflight.
 *
 * Definir VITE_API_BASE_URL (p. ej. "http://localhost:8080") para saltarse el
 * proxy y llamar al backend directamente; en ese caso el backend debe tener
 * este origen en `app.cors.allowed-origins`, cosa que ya hace.
 */
export const API_BASE_URL: string = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

/** Fuerza los datos de demostracion sin intentar conectar con la API. */
export const FORCE_DEMO: boolean = import.meta.env.VITE_USE_MOCK === 'true'

/** Equipos por pagina en el tablero. */
export const DEFAULT_PAGE_SIZE = 12

export const PAGE_SIZE_OPTIONS = [6, 12, 24] as const

/** Claves de localStorage, centralizadas para no repetir cadenas sueltas. */
export const STORAGE_KEYS = {
  token: 'lis.token',
  language: 'lis.lang',
  /** Identidad usada al reservar sin iniciar sesion. */
  guest: 'lis.guest',
} as const