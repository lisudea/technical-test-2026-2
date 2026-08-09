/** Equipment states as defined by the backend (EstadoEquipo enum). */
export type EstadoEquipo = 'DISPONIBLE' | 'MANTENIMIENTO' | 'BAJA';

/** Reservation states as defined by the backend (EstadoReserva enum). */
export type EstadoReserva = 'ACTIVA' | 'CANCELADA' | 'COMPLETADA';

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
}

export interface Usuario {
  idUsuario: number;
  nombre: string;
  correo: string;
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

export interface CrearReservaPayload {
  nombreUsuario: string;
  correoUsuario: string;
  idEquipo: number;
  fechaHoraInicio: string;
  fechaHoraFin: string;
  motivo: string;
}
