export type CategoriaEquipo = 'MICROCONTROLADORES' | 'VR' | 'REDES' | 'COMPUTO' | 'IMPRESION_3D'
export type EstadoEquipo = 'DISPONIBLE' | 'RESERVADO' | 'MANTENIMIENTO'
export type EstadoReserva = 'ACTIVA' | 'CANCELADA'

export interface Equipo {
  id: string
  nombre: string
  serial: string
  categoria: CategoriaEquipo
  estado: EstadoEquipo
  horaApertura?: number | null
  horaCierre?: number | null
  creadoEn: string
}

export interface Reserva {
  id: string
  equipoId: string
  nombreUsuario: string
  correoUsuario: string
  inicio: string
  fin: string
  estado: EstadoReserva
  creadaEn: string
  equipo?: Pick<Equipo, 'nombre' | 'serial' | 'categoria'>
}

export interface Paginado<T> {
  datos: T[]
  total: number
  pagina: number
  limite: number
  totalPaginas: number
}

export interface Usuario {
  id: string
  nombre: string
  correo: string
  rol: 'USUARIO' | 'ADMIN'
}

export interface Sesion {
  usuario: Usuario
  token: string
  refreshToken: string
  sesionId?: string
}

export interface SesionActiva {
  id: string
  dispositivo: string | null
  creadoEn: string
  expiraEn: string
}

export interface ResumenEstadisticas {
  equipos: {
    total: number
    porEstado: Record<EstadoEquipo, number>
    porCategoria: Record<string, number>
  }
  reservas: { total: number; activas: number; canceladas: number; hoy: number; ultimos7Dias: number }
  ocupacion: { enCursoAhora: number; equiposOperativos: number; porcentaje: number }
  topUsuarios: { nombre: string; correo: string; totalReservas: number }[]
}

export interface TopEquipo {
  equipo: Equipo
  totalReservas: number
}

export interface RegistroAuditoria {
  id: string
  accion: string
  entidad: string
  entidadId?: string
  detalle: string
  actorNombre: string
  actorCorreo: string
  creadoEn: string
}

export interface Mascota {
  nombre: string
  xp: number
  equipados: string[]
  inventario: { clave: string; origen: string; obtenidoEn: string }[]
  regaloBienvenidaPendiente: boolean
}

export type CategoriaForo = 'EXPERIENCIAS' | 'CREACIONES' | 'CONSEJOS' | 'METODOLOGIAS'

export interface Publicacion {
  id: string
  autorId: string
  autorNombre: string
  titulo: string
  contenido: string
  categoria: CategoriaForo
  area?: string | null
  creadaEn: string
}
