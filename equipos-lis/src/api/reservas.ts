import { buildQuery, request } from './client'
import type { EstadoReserva, PageResponse, Reserva, ReservaRequest } from './types'

// Este archivo contiene funciones para interactuar con la API de reservas. Cada función realiza una solicitud HTTP a un 
// endpoint específico de la API y devuelve los datos correspondientes. Si ocurre un error durante la solicitud, se lanza un 
// ApiError con información sobre el error.

// La interfaz ListarReservasParams define los parámetros que se pueden pasar a la función listarReservas. Todos los parámetros
// son opcionales y se utilizan para filtrar y paginar los resultados de la lista de reservas.
export interface ListarReservasParams {
  equipoId?: number
  estado?: EstadoReserva
  page?: number
  size?: number
}

// La función crearReserva realiza una solicitud POST a la API para crear una nueva reserva. Se pasa un objeto ReservaRequest con los
// datos de la reserva a crear. La función devuelve una promesa que se resuelve con un objeto Reserva que contiene la información
// de la reserva creada.
export function crearReserva(data: ReservaRequest): Promise<Reserva> {
  return request<Reserva>('/reservas', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// La función cancelarReserva realiza una solicitud POST a la API para cancelar una reserva existente. Se pasa el ID de la reserva 
// a cancelar. La función devuelve una promesa que se resuelve con un objeto Reserva que contiene la información
// de la reserva cancelada.
export function cancelarReserva(id: number): Promise<Reserva> {
  return request<Reserva>(`/reservas/${id}/cancelar`, {
    method: 'POST',
  })
}

// La función listarReservas realiza una solicitud GET a la API para obtener una lista de reservas. Se pueden pasar parámetros
// opcionales para filtrar y paginar los resultados. La función devuelve una promesa que se resuelve con un objeto PageResponse
// que contiene la lista de reservas y la información de paginación.
export function listarReservas(
  params: ListarReservasParams = {},
): Promise<PageResponse<Reserva>> {
  return request<PageResponse<Reserva>>(`/reservas${buildQuery(params)}`)
}
