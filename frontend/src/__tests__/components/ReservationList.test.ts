import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import ReservationList from '../../components/ReservationList.vue'
import { ReservationStatus } from '../../types/reservation'
import en from '../../i18n/en.json'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

const mockReservations = [
  {
    id: 1,
    equipment: { id: 1, name: 'Arduino', serialNumber: 'SN-001' },
    user: { id: 1, name: 'John Doe', email: 'john@udea.edu.co' },
    startTime: '2026-08-10T10:00:00',
    endTime: '2026-08-10T12:00:00',
    createdAt: '2026-08-09T12:00:00',
    status: ReservationStatus.ACTIVE,
  },
  {
    id: 2,
    equipment: { id: 1, name: 'Arduino', serialNumber: 'SN-001' },
    user: { id: 2, name: 'Jane Doe', email: 'jane@udea.edu.co' },
    startTime: '2026-08-10T14:00:00',
    endTime: '2026-08-10T16:00:00',
    createdAt: '2026-08-09T12:00:00',
    status: ReservationStatus.CANCELLED,
  },
]

describe('ReservationList', () => {
  it('shows loading text when loading', () => {
    const wrapper = mount(ReservationList, {
      props: { reservations: [], loading: true },
      global: { plugins: [i18n] },
    })
    expect(wrapper.text()).toContain('Loading reservations...')
  })

  it('shows empty message when no reservations', () => {
    const wrapper = mount(ReservationList, {
      props: { reservations: [], loading: false },
      global: { plugins: [i18n] },
    })
    expect(wrapper.text()).toContain('No reservations')
  })

  it('renders reservation rows', () => {
    const wrapper = mount(ReservationList, {
      props: { reservations: mockReservations, loading: false },
      global: { plugins: [i18n] },
    })
    expect(wrapper.text()).toContain('John Doe')
    expect(wrapper.text()).toContain('john@udea.edu.co')
    expect(wrapper.text()).toContain('Jane Doe')
  })

  it('shows Cancel button only for ACTIVE reservations', () => {
    const wrapper = mount(ReservationList, {
      props: { reservations: mockReservations, loading: false },
      global: { plugins: [i18n] },
    })
    const cancelButtons = wrapper.findAll('button')
    expect(cancelButtons.length).toBe(1)
  })

  it('emits cancel with reservation ID', async () => {
    const wrapper = mount(ReservationList, {
      props: { reservations: mockReservations, loading: false },
      global: { plugins: [i18n] },
    })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('cancel')).toBeTruthy()
    expect(wrapper.emitted('cancel')![0]).toEqual([1])
  })
})
