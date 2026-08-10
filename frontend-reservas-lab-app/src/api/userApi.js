import { httpRequest } from './client.js'
import { PagedModelDTO } from '../models/paged.js'
import { UserDTO } from '../models/user.js'

const BASE = '/users'

/**
 * GET /api/users?page&size  (solo administrador)
 * El backend devuelve una Page<T> de Spring (campo "content").
 */
export async function listUsers({ page = 0, size = 10 } = {}) {
  const params = new URLSearchParams()
  params.set('page', String(page))
  params.set('size', String(size))

  const json = await httpRequest(`${BASE}?${params.toString()}`)
  return PagedModelDTO.fromJson(json, UserDTO.fromJson)
}