/**
 * Canonical operational status codes for a piece of equipment.
 * The backend also exposes a human-readable name per status,
 * but the UI always branches on `code`.
 */
export type OperationalStatusCode = 'AVAILABLE' | 'RESERVED' | 'MAINTENANCE'

export interface EquipmentCategory {
  id: string
  name: string
}

export interface OperationalStatus {
  id: string
  name: string
  code: OperationalStatusCode
}

export interface Equipment {
  id: string
  name: string
  description?: string
  serialNumber?: string
  macAddress?: string
  location?: string
  imageUrl?: string
  category: EquipmentCategory
  operationalStatus: OperationalStatus
  createdAt: string
  updatedAt: string
}

export interface EquipmentListFilters {
  page?: number
  size?: number
  categoryId?: string
  operationalStatusId?: string
  query?: string
}

export interface EquipmentInput {
  name: string
  serialNumber?: string
  macAddress?: string
  categoryId: string
  operationalStatusId: string
}

export interface AvailabilityResponse {
  equipmentId: string
  availability: 'AVAILABLE' | 'RESERVED' | 'MAINTENANCE'
  nextAvailableStartAt?: string
  nextReservedStartAt?: string
}
