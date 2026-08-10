import { obtenerSesion } from '../api/cliente'

export interface EstadoMascota {
  xp: number
  misiones: Record<string, string>
  reservas: number
  categorias: string[]
  llego: boolean
}

export const MISIONES = [
  { id: 'primera-reserva', xp: 25 },
  { id: 'cinco-reservas', xp: 50 },
  { id: 'cancelar-a-tiempo', xp: 20 },
  { id: 'tres-categorias', xp: 40 },
  { id: 'tema-oscuro', xp: 10 },
  { id: 'idioma', xp: 10 },
] as const

export const NIVELES = [
  { nivel: 1, desde: 0 },
  { nivel: 2, desde: 50 },
  { nivel: 3, desde: 140 },
]

export const XP_MAXIMO = MISIONES.reduce((suma, m) => suma + m.xp, 0)

const VACIO: EstadoMascota = { xp: 0, misiones: {}, reservas: 0, categorias: [], llego: false }

function clave() {
  const sesion = obtenerSesion()
  return sesion ? `lis-mascota-${sesion.usuario.id}` : null
}

export function obtenerMascota(): EstadoMascota {
  const k = clave()
  if (!k) return VACIO
  try {
    return { ...VACIO, ...JSON.parse(localStorage.getItem(k) ?? '{}') }
  } catch {
    return VACIO
  }
}

function guardar(estado: EstadoMascota) {
  const k = clave()
  if (k) localStorage.setItem(k, JSON.stringify(estado))
}

export function nivelActual(xp: number) {
  return [...NIVELES].reverse().find((n) => xp >= n.desde)?.nivel ?? 1
}

function completar(estado: EstadoMascota, misionId: string) {
  if (estado.misiones[misionId]) return
  const mision = MISIONES.find((m) => m.id === misionId)
  if (!mision) return
  estado.misiones[misionId] = new Date().toISOString()
  estado.xp += mision.xp
  window.dispatchEvent(new CustomEvent('lis-mision', { detail: { mision: misionId, xp: mision.xp } }))
}

type Evento =
  | { tipo: 'reserva'; categoria: string }
  | { tipo: 'cancelacion-a-tiempo' }
  | { tipo: 'tema-oscuro' }
  | { tipo: 'idioma' }

export function registrarEvento(evento: Evento) {
  const k = clave()
  if (!k) return
  const estado = obtenerMascota()

  if (evento.tipo === 'reserva') {
    estado.reservas += 1
    if (!estado.categorias.includes(evento.categoria)) estado.categorias.push(evento.categoria)
    completar(estado, 'primera-reserva')
    if (estado.reservas >= 5) completar(estado, 'cinco-reservas')
    if (estado.categorias.length >= 3) completar(estado, 'tres-categorias')
  }
  if (evento.tipo === 'cancelacion-a-tiempo') completar(estado, 'cancelar-a-tiempo')
  if (evento.tipo === 'tema-oscuro') completar(estado, 'tema-oscuro')
  if (evento.tipo === 'idioma') completar(estado, 'idioma')

  guardar(estado)
}

export function marcarLlegada(): boolean {
  const k = clave()
  if (!k) return false
  const estado = obtenerMascota()
  if (estado.llego) return false
  estado.llego = true
  guardar(estado)
  return true
}
