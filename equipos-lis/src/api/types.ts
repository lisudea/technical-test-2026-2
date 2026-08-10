// Este archivo contiene las definiciones de tipos para la API. Estos tipos se utilizan para asegurar que los datos que se envían y reciben
// de la API tengan el formato correcto.

export const CATEGORIAS = ['MICROCONTROLADORES', 'VR', 'REDES'] as const
export type CategoriaEquipo = (typeof CATEGORIAS)[number]

export const ESTADOS_EQUIPO = ['DISPONIBLE', 'RESERVADO', 'MANTENIMIENTO'] as const
export type EstadoEquipo = (typeof ESTADOS_EQUIPO)[number]

export const ESTADOS_RESERVA = ['ACTIVA', 'FINALIZADA', 'CANCELADA'] as const
export type EstadoReserva = (typeof ESTADOS_RESERVA)[number]

// La interfaz Equipo representa un equipo en el sistema. Contiene información sobre el ID del equipo, su nombre, número de serie,
// categoría y estado.
export interface Equipo {
  id: number
  nombre: string
  numeroSerie: string
  categoria: CategoriaEquipo
  estado: EstadoEquipo
}

// La interfaz PageResponse representa una respuesta paginada de la API. Contiene un arreglo de elementos del tipo genérico T, así como
// información sobre la página actual, el tamaño de la página, el número total de elementos y el número total de páginas.
export interface PageResponse<T> {
  contenido: T[]
  pagina: number
  tamano: number
  totalElementos: number
  totalPaginas: number
}

// La interfaz ReservaRequest representa una solicitud para crear una reserva. Contiene información sobre el nombre y correo del 
// usuario, el ID del equipo a reservar, y las fechas de reserva y devolución.
export interface ReservaRequest {
  nombreUsuario: string
  correoUsuario: string
  equipoId: number
  fechaReserva: string
  fechaDevolucion: string
}

// La interfaz Reserva representa una reserva en el sistema. Contiene información sobre el ID de la reserva, las fechas 
// de reserva y devolución, el estado de la reserva, y detalles sobre el equipo y el usuario asociados a la reserva.
export interface Reserva {
  id: number
  fechaReserva: string
  fechaDevolucion: string
  estado: EstadoReserva
  equipo: {
    id: number
    nombre: string
  }
  usuario: {
    nombre: string
    correo: string
  }
}

// La interfaz TopEquipo representa un equipo con la mayor cantidad de reservas. Contiene información sobre el ID y nombre del equipo,
// así como la cantidad de reservas asociadas a ese equipo.
export interface TopEquipo {
  equipoId: number
  equipoNombre: string
  cantidadReservas: number
}

// La interfaz CampoError representa un error de validación en un campo específico. Contiene información sobre el nombre del campo
// y el mensaje de error asociado a ese campo.
export interface CampoError {
  campo: string
  mensaje: string
}

// La interfaz ApiErrorBody representa el cuerpo de un error de la API. Contiene información sobre el código de estado HTTP, 
// el mensaje de error y la ruta de la solicitud.
export interface ApiErrorBody {
  status: number
  error: string
  message: string
  path: string
  timestamp: string
  errors?: CampoError[]
}
