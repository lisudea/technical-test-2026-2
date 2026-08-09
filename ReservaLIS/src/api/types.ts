// ─── Backend enum values ───────────────────────────────────────────────────
export type EstadoFisico = "DISPONIBLE" | "MANTENIMIENTO" | "DE_BAJA";
export type EstadoReserva = "ACTIVA" | "CANCELADA";

// ─── Response DTOs ─────────────────────────────────────────────────────────
export interface CategoriaDTO {
  id: number;
  nombre: string;
  descripcion?: string;
}

export interface EquipoResponseDTO {
  id: number;
  nombre: string;
  identificador: string;
  categoria: { id: number; nombre: string };
  estadoFisico: EstadoFisico;
  fechaRegistro: string;
  fechaActualizacion: string;
}

export interface ReservaResponseDTO {
  id: number;
  equipo: { id: number; nombre: string };
  usuarioNombre: string;
  // usuarioCorreo intentionally absent from API responses
  fechaHoraInicio: string;
  fechaHoraFin: string;
  estadoReserva: EstadoReserva;
  fechaCreacion: string;
}

export interface PageDTO<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}

export interface LoginResponseDTO {
  token: string;
  correo: string;
  rol: string;
}

export interface TopEquipoDTO {
  equipoId: number;
  nombre: string;
  totalReservas: number;
}

// ─── Request bodies ─────────────────────────────────────────────────────────
export interface EquipoRequestBody {
  nombre: string;
  identificador: string;
  categoriaId: number;
  estadoFisico: EstadoFisico;
}

export interface CategoriaRequestBody {
  nombre: string;
  descripcion?: string;
}

export interface ReservaRequestBody {
  equipoId: number;
  usuarioNombre: string;
  usuarioCorreo: string;
  fechaHoraInicio: string; // ISO-8601 LocalDateTime: "2026-08-09T10:00:00"
  fechaHoraFin: string;
}

// ─── Derived frontend type ──────────────────────────────────────────────────
// The "reservado" state is calculated by the frontend by crossing equipment
// physical state with currently-active reservations covering the current time.
export type EquipoStatus = "disponible" | "reservado" | "mantenimiento" | "baja";

export interface EquipoConEstado extends EquipoResponseDTO {
  statusUI: EquipoStatus;
}
