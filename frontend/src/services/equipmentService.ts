import api from './api'
import type { Equipment, PageResponse } from '../types/equipment'
import type { EquipmentCategory, EquipmentStatus } from '../types/equipment'

export function getEquipment(params: {
  page?: number
  size?: number
  category?: EquipmentCategory
  status?: EquipmentStatus
}) {
  return api.get<PageResponse<Equipment>>('/equipment', { params })
}

export function getEquipmentById(id: number) {
  return api.get<Equipment>(`/equipment/${id}`)
}

export function createEquipment(data: {
  name: string
  serialNumber: string
  macAddress?: string
  category: EquipmentCategory
  status?: EquipmentStatus
}) {
  return api.post<Equipment>('/equipment', data)
}

export function updateEquipment(id: number, data: {
  name: string
  serialNumber: string
  macAddress?: string
  category: EquipmentCategory
  status: EquipmentStatus
}) {
  return api.put<Equipment>(`/equipment/${id}`, data)
}
