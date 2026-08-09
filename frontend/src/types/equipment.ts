export const EquipmentCategory = {
  MICROCONTROLLERS: 'MICROCONTROLLERS',
  VR: 'VR',
  NETWORKING: 'NETWORKING',
  SENSORS: 'SENSORS',
  ROBOTICS: 'ROBOTICS',
  COMPUTING: 'COMPUTING',
} as const
export type EquipmentCategory = (typeof EquipmentCategory)[keyof typeof EquipmentCategory]

export const EquipmentStatus = {
  AVAILABLE: 'AVAILABLE',
  RESERVED: 'RESERVED',
  MAINTENANCE: 'MAINTENANCE',
} as const
export type EquipmentStatus = (typeof EquipmentStatus)[keyof typeof EquipmentStatus]

export interface Equipment {
  id: number
  name: string
  serialNumber: string
  macAddress: string | null
  category: EquipmentCategory
  status: EquipmentStatus
  createdAt: string
  updatedAt: string
}

export interface PageResponse<T> {
  content: T[]
  totalPages: number
  totalElements: number
  last: boolean
  first: boolean
  size: number
  number: number
  numberOfElements: number
  empty: boolean
}
