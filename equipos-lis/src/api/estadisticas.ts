import { request } from './client'
import type { TopEquipo } from './types'

// Este archivo contiene funciones para interactuar con la API de estadísticas. Cada función realiza una solicitud HTTP a un 
// endpoint específico de la API y devuelve los datos correspondientes. Si ocurre un error durante la solicitud, se lanza un 
// ApiError con información sobre el error.

// La función top5Equipos realiza una solicitud GET a la API para obtener los 5 equipos con más incidencias. La función devuelve
// una promesa que se resuelve con un arreglo de objetos TopEquipo que contienen la información de cada equipo.
export function top5Equipos(): Promise<TopEquipo[]> {
  return request<TopEquipo[]>('/estadisticas/top-5')
}
