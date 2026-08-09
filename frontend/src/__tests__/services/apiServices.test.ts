import { describe, it, expect, vi } from 'vitest'
import api from '../../services/api'
import { getEquipment, getEquipmentById } from '../../services/equipmentService'
import { EquipmentCategory, EquipmentStatus } from '../../types/equipment'

vi.mock('../../services/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

describe('equipmentService', () => {
  it('getEquipment calls GET /equipment with params', async () => {
    const mockData = {
      content: [],
      totalPages: 0, totalElements: 0, first: true, last: true,
      size: 10, number: 0, numberOfElements: 0, empty: true,
    }
    vi.mocked(api.get).mockResolvedValue({ data: mockData })

    const result = await getEquipment({
      page: 0, size: 10,
      category: EquipmentCategory.VR,
      status: EquipmentStatus.AVAILABLE,
    })

    expect(api.get).toHaveBeenCalledWith('/equipment', {
      params: { page: 0, size: 10, category: 'VR', status: 'AVAILABLE' },
    })
    expect(result.data).toEqual(mockData)
  })

  it('getEquipmentById calls GET /equipment/{id}', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { id: 1, name: 'Test' } })
    await getEquipmentById(1)
    expect(api.get).toHaveBeenCalledWith('/equipment/1')
  })
})

describe('reservationService', () => {
  it('getReservations calls GET /reservations', async () => {
    const { getReservations } = await import('../../services/reservationService')
    vi.mocked(api.get).mockResolvedValue({ data: [] })
    await getReservations()
    expect(api.get).toHaveBeenCalledWith('/reservations')
  })

  it('getEquipmentReservations calls GET /equipment/{id}/reservations', async () => {
    const { getEquipmentReservations } = await import('../../services/reservationService')
    vi.mocked(api.get).mockResolvedValue({ data: [] })
    await getEquipmentReservations(42)
    expect(api.get).toHaveBeenCalledWith('/equipment/42/reservations')
  })

  it('cancelReservation calls DELETE /reservations/{id}', async () => {
    const { cancelReservation } = await import('../../services/reservationService')
    vi.mocked(api.delete).mockResolvedValue({})
    await cancelReservation(5)
    expect(api.delete).toHaveBeenCalledWith('/reservations/5')
  })
})
