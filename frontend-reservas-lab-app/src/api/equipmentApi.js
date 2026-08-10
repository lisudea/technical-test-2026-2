import { httpRequest } from './client.js'
import { PagedModelDTO, fromEntityModel } from '../models/paged.js'
import { EquipmentDTO, CreateEquipmentDTO, UpdateEquipmentDTO } from '../models/equipment.js'

const BASE = '/equipment'

/**
 * GET /api/equipment?page&size&categoryId&status
 */
export async function listEquipment({ page = 0, size = 10, categoryId = null, status = null } = {}) {
  const params = new URLSearchParams()
  params.set('page', String(page))
  params.set('size', String(size))
  if (categoryId) params.set('categoryId', String(categoryId))
  if (status) params.set('status', status)

  const json = await httpRequest(`${BASE}?${params.toString()}`)
  return PagedModelDTO.fromJson(json, EquipmentDTO.fromJson)
}

/**
 * GET /api/equipment/{id}
 */
export async function getEquipment(id) {
  const json = await httpRequest(`${BASE}/${id}`)
  return fromEntityModel(json, EquipmentDTO.fromJson)
}

/**
 * POST /api/equipment (solo administrador)
 */
export async function createEquipment(payload) {
  const body = payload instanceof CreateEquipmentDTO ? payload.toJson() : payload
  const json = await httpRequest(BASE, { method: 'POST', body })
  return fromEntityModel(json, EquipmentDTO.fromJson)
}

/**
 * PUT /api/equipment/{id} (solo administrador)
 */
export async function updateEquipment(id, payload) {
  const body = payload instanceof UpdateEquipmentDTO ? payload.toJson() : payload
  const json = await httpRequest(`${BASE}/${id}`, { method: 'PUT', body })
  return fromEntityModel(json, EquipmentDTO.fromJson)
}

/**
 * DELETE /api/equipment/{id} (solo administrador)
 */
export async function deleteEquipment(id) {
  return httpRequest(`${BASE}/${id}`, { method: 'DELETE' })
}