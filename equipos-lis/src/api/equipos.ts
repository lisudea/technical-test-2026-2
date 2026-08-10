import { buildQuery, request } from './client'
import type { CategoriaEquipo, Equipo, EstadoEquipo, PageResponse } from './types'

// Este archivo contiene funciones para interactuar con la API de equipos. Cada función realiza una solicitud HTTP a un 
// endpoint específico de la API y devuelve los datos correspondientes. Si ocurre un error durante la solicitud, se lanza un 
// ApiError con información sobre el error.

// La interfaz ListarEquiposParams define los parámetros que se pueden pasar a la función listarEquipos. Todos los parámetros
// son opcionales y se utilizan para filtrar y paginar los resultados de la lista de equipos. 
export interface ListarEquiposParams {
  categoria?: CategoriaEquipo
  estado?: EstadoEquipo
  page?: number
  size?: number
}

// La función listarEquipos realiza una solicitud GET a la API para obtener una lista de equipos. Se pueden pasar parámetros
// opcionales para filtrar y paginar los resultados. La función devuelve una promesa que se resuelve con un objeto PageResponse
// que contiene la lista de equipos y la información de paginación.
export function listarEquipos(
  params: ListarEquiposParams = {},
): Promise<PageResponse<Equipo>> {
  return request<PageResponse<Equipo>>(`/equipos${buildQuery(params)}`)
}

// La función getEquipo realiza una solicitud GET a la API para obtener los detalles de un equipo específico por su ID.
// La función devuelve una promesa que se resuelve con un objeto Equipo que contiene la información del equipo.
export function getEquipo(id: number): Promise<Equipo> {
  return request<Equipo>(`/equipos/${id}`)
}

// La función crearEquipo realiza una solicitud POST a la API para crear un nuevo equipo. Se pasa un objeto Equipo con los
// datos del equipo a crear. La función devuelve una promesa que se resuelve con un objeto Equipo que contiene la información
// del equipo creado.
export function crearEquipo(data: Equipo): Promise<Equipo> {
  return request<Equipo>('/equipos', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// La función actualizarEquipo realiza una solicitud PUT a la API para actualizar un equipo existente. Se pasa un objeto Equipo
// con los datos del equipo a actualizar. La función devuelve una promesa que se resuelve con un objeto Equipo que contiene la
// información del equipo actualizado.
export function actualizarEquipo(data: Equipo): Promise<Equipo> {
  return request<Equipo>('/equipos', {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}
