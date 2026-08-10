import { httpRequest } from './client.js'
import { CategoryDTO, CreateCategoryDTO } from '../models/category.js'

const BASE = '/categories'

/**
 * GET /api/categories -> lista completa (sin paginacion)
 */
export async function listCategories() {
  const json = await httpRequest(BASE)
  return Array.isArray(json) ? json.map(CategoryDTO.fromJson) : []
}

/**
 * GET /api/categories/{id}
 */
export async function getCategory(id) {
  const json = await httpRequest(`${BASE}/${id}`)
  return CategoryDTO.fromJson(json)
}

/**
 * POST /api/categories (solo administrador)
 */
export async function createCategory(payload) {
  const body = payload instanceof CreateCategoryDTO ? payload.toJson() : payload
  const json = await httpRequest(BASE, { method: 'POST', body })
  return CategoryDTO.fromJson(json)
}