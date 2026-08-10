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

async function refrescarSesion(): Promise<boolean> {
  const sesion = obtenerSesion()
  if (!sesion) return false
  try {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: sesion.refreshToken }),
    })
    if (!res.ok) {
      guardarSesion(null)
      return false
    }
    guardarSesion(await res.json())
    return true
  } catch {
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
    return fetch(`${BASE}${ruta}`, {
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
