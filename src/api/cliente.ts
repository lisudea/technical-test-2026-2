import type { Sesion } from './tipos'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
const CLAVE_SESION = 'lis-sesion'

export class ApiError extends Error {
  status: number

  constructor(status: number, mensaje: string) {
    super(mensaje)
    this.status = status
  }
}

type Oyente = (sesion: Sesion | null) => void
const oyentes = new Set<Oyente>()

export function alCambiarSesion(oyente: Oyente) {
  oyentes.add(oyente)
  return () => {
    oyentes.delete(oyente)
  }
}

export function obtenerSesion(): Sesion | null {
  const crudo = localStorage.getItem(CLAVE_SESION)
  if (!crudo) return null
  try {
    return JSON.parse(crudo) as Sesion
  } catch {
    return null
  }
}

export function guardarSesion(sesion: Sesion | null) {
  if (sesion) localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion))
  else localStorage.removeItem(CLAVE_SESION)
  oyentes.forEach((o) => o(sesion))
}

let refrescando: Promise<boolean> | null = null

const TIEMPO_LIMITE = 45000

// fetch con timeout: en iOS una conexión suspendida puede quedar colgada sin
// resolver ni fallar nunca. El AbortController garantiza que toda petición
// termina, así una query nunca se queda en skeleton para siempre.
async function pedir(url: string, init: RequestInit): Promise<Response> {
  const ctrl = new AbortController()
  const id = setTimeout(() => ctrl.abort(), TIEMPO_LIMITE)
  try {
    return await fetch(url, { ...init, signal: ctrl.signal })
  } catch (e) {
    if (ctrl.signal.aborted) throw new ApiError(408, 'La solicitud tardó demasiado')
    throw e
  } finally {
    clearTimeout(id)
  }
}

// Limpia el estado de refresco en memoria al cambiar de sesión (login/logout).
// Un refresco colgado no debe envenenar la siguiente sesión.
export function reiniciarAuth() {
  refrescando = null
}

async function refrescarSesion(): Promise<boolean> {
  const sesion = obtenerSesion()
  if (!sesion) return false
  try {
    const res = await pedir(`${BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: sesion.refreshToken }),
    })
    if (res.ok) {
      guardarSesion(await res.json())
      return true
    }
    // el refresh token ya no sirve: cerramos sesión para caer a login de forma limpia
    if (res.status === 401 || res.status === 403) guardarSesion(null)
    return false
  } catch {
    // red o timeout: transitorio, no cerramos sesión (la query reintentará)
    return false
  }
}

function extraerMensaje(cuerpo: unknown): string {
  if (cuerpo && typeof cuerpo === 'object' && 'message' in cuerpo) {
    const m = (cuerpo as { message: string | string[] }).message
    return Array.isArray(m) ? m.join('. ') : m
  }
  return 'Error inesperado'
}

interface Opciones {
  metodo?: string
  cuerpo?: unknown
}

export async function api<T>(ruta: string, opciones: Opciones = {}): Promise<T> {
  const hacer = () => {
    const sesion = obtenerSesion()
    return pedir(`${BASE}${ruta}`, {
      method: opciones.metodo ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(sesion && { Authorization: `Bearer ${sesion.token}` }),
      },
      ...(opciones.cuerpo !== undefined && { body: JSON.stringify(opciones.cuerpo) }),
    })
  }

  let res = await hacer()

  if (res.status === 401 && obtenerSesion() && !ruta.startsWith('/auth/')) {
    refrescando ??= refrescarSesion().finally(() => {
      refrescando = null
    })
    if (await refrescando) res = await hacer()
  }

  if (!res.ok) {
    const cuerpo = await res.json().catch(() => null)
    throw new ApiError(res.status, extraerMensaje(cuerpo))
  }

  return res.json() as Promise<T>
}
