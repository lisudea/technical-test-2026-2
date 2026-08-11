/** Equipment states as defined by the backend (EstadoEquipo enum). */
export type EstadoEquipo = 'DISPONIBLE' | 'MANTENIMIENTO' | 'BAJA';

/** Reservation states as defined by the backend (EstadoReserva enum). */
export type EstadoReserva = 'ACTIVA' | 'CANCELADA' | 'COMPLETADA';

/**
 * Authority levels, ordered from least to most privileged.
 *
 * The array is the source of truth for the ordering used by `hasRole`; the
 * union type is derived from it so the two can never drift apart.
 */
export const ROLES = ['ESTUDIANTE', 'AUXILIAR', 'ADMIN'] as const;
export type Rol = (typeof ROLES)[number];

/**
 * Physical hand-over lifecycle, tracked separately from the booking state.
 * `estado` says whether the slot is occupied; `estadoPrestamo` says what
 * actually happened at the counter.
 */
export type EstadoPrestamo =
  | 'PENDIENTE'
  | 'ENTREGADO'
  | 'DEVUELTO'
  | 'NO_RECLAMADO';

export type EstadoSancion = 'ACTIVA' | 'LEVANTADA';
export type OrigenSancion = 'MANUAL' | 'AUTOMATICA';

export interface Equipo {
  idEquipo: number;
  nombre: string;
  numeroSerie: string;
  macAddress: string;
  descripcion: string;
  estado: EstadoEquipo;
  idCategoria: number;
  categoriaNombre: string;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface Categoria {
  idCategoria: number;
  nombre: string;
  descripcion: string;
}

export interface Reserva {
  idReserva: number;
  idEquipo: number;
  equipoNombre: string;
  idUsuario: number;
  usuarioNombre: string;
  correoUsuario: string;
  fechaHoraInicio: string;
  fechaHoraFin: string;
  estado: EstadoReserva;
  motivo: string;
  fechaCreacion: string;
  fechaCancelacion: string | null;
  /** Loan block — populated once the loan desk touches the reservation. */
  estadoPrestamo: EstadoPrestamo;
  fechaEntrega: string | null;
  fechaDevolucion: string | null;
  entregadoPorNombre: string | null;
  recibidoPorNombre: string | null;
  observacionesPrestamo: string | null;
}

export interface Usuario {
  idUsuario: number;
  nombre: string;
  correo: string;
  rol: Rol;
  fechaRegistro: string | null;
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

/** RFC 7807 problem detail returned by the backend on errors. */
export interface ProblemDetail {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  /** Custom field carrying validation messages. */
  message?: string;
  violations?: Array<{ field: string; message: string }>;
}

export interface AuthResponse {
  token: string;
  tipo: string;
  expiresIn: number;
}

export interface PerfilResponse {
  nombre: string;
  correo: string;
  rol: Rol;
}

export interface EquipoTop {
  idEquipo: number;
  nombre: string;
  categoria: string;
  totalReservas: number;
}

export interface EquipoFilters {
  nombre?: string;
  estado?: string;
  categoria?: string;
  page?: number;
  size?: number;
}

export interface ReservaFilters {
  idEquipo?: number;
  correo?: string;
  fechaHoraInicio?: string;
  fechaHoraFin?: string;
  estado?: string;
  page?: number;
  size?: number;
}

export interface Sancion {
  idSancion: number;
  idUsuario: number;
  usuarioNombre: string;
  correoUsuario: string;
  motivo: string;
  fechaInicio: string;
  fechaFin: string;
  estado: EstadoSancion;
  origen: OrigenSancion;
  /** Computed server-side: ACTIVA *and* the window has not elapsed. */
  vigente: boolean;
  idReserva: number | null;
  creadaPorNombre: string | null;
  levantadaPorNombre: string | null;
  fechaLevantamiento: string | null;
  observacionLevantamiento: string | null;
  fechaCreacion: string;
}

export interface CrearSancionPayload {
  idUsuario: number;
  motivo: string;
  dias: number;
}

export interface ResumenAdmin {
  totalEquipos: number;
  equiposDisponibles: number;
  equiposMantenimiento: number;
  equiposBaja: number;
  reservasActivas: number;
  reservasEnCurso: number;
  prestamosPendientes: number;
  prestamosVencidos: number;
  sancionesVigentes: number;
  totalUsuarios: number;
  totalAuxiliares: number;
  totalAdmins: number;
}

export interface ResumenPrestamos {
  pendientes: number;
  entregados: number;
  devueltos: number;
  noReclamados: number;
  vencidos: number;
}

export interface EquipoPayload {
  nombre: string;
  numeroSerie?: string;
  macAddress?: string;
  descripcion?: string;
  idCategoria: number;
}

export interface UsuarioFilters {
  rol?: string;
  buscar?: string;
  page?: number;
  size?: number;
}

export interface SancionFilters {
  idUsuario?: number;
  estado?: string;
  soloVigentes?: boolean;
  page?: number;
  size?: number;
}

export interface AgendaFilters {
  fecha?: string;
  estadoPrestamo?: string;
  page?: number;
  size?: number;
}

export interface CrearReservaPayload {
  nombreUsuario: string;
  correoUsuario: string;
  idEquipo: number;
  fechaHoraInicio: string;
  fechaHoraFin: string;
  motivo: string;
}
