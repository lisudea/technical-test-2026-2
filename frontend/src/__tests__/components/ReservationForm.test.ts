import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import ReservationForm from '../../components/ReservationForm.vue'
import en from '../../i18n/en.json'

const mockGetUserByEmail = vi.fn()
const mockCreateUser = vi.fn()
const mockCreateReservation = vi.fn()

vi.mock('../../services/userService', () => ({
  getUserByEmail: (...args: any[]) => mockGetUserByEmail(...args),
  createUser: (...args: any[]) => mockCreateUser(...args),
}))

vi.mock('../../services/reservationService', () => ({
  createReservation: (...args: any[]) => mockCreateReservation(...args),
}))

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

describe('ReservationForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function mountForm() {
    return mount(ReservationForm, {
      props: { equipmentId: 1 },
      global: { plugins: [i18n] },
    })
  }

  it('renders the form with all fields', () => {
    const wrapper = mountForm()
    expect(wrapper.text()).toContain('Create Reservation')
    expect(wrapper.find('#rname').exists()).toBe(true)
    expect(wrapper.find('#remail').exists()).toBe(true)
    expect(wrapper.find('#rstart').exists()).toBe(true)
    expect(wrapper.find('#rend').exists()).toBe(true)
  })

  it('shows validation errors when submitting empty form', async () => {
    const wrapper = mountForm()
    await wrapper.find('form').trigger('submit.prevent')
    expect(wrapper.text()).toContain('Name is required')
    expect(wrapper.text()).toContain('Email is required')
  })

  it('shows email validation error for invalid email', async () => {
    const wrapper = mountForm()
    await wrapper.find('#rname').setValue('John')
    await wrapper.find('#remail').setValue('invalid')
    await wrapper.find('form').trigger('submit.prevent')
    expect(wrapper.text()).toContain('Invalid email format')
  })

  it('shows error when start time is after end time', async () => {
    const wrapper = mountForm()
    await wrapper.find('#rname').setValue('John')
    await wrapper.find('#remail').setValue('john@udea.edu.co')
    await wrapper.find('#rstart').setValue('2026-08-10T12:00')
    await wrapper.find('#rend').setValue('2026-08-10T10:00')
    await wrapper.find('form').trigger('submit.prevent')
    expect(wrapper.text()).toContain('Start time must be before end time')
  })

  it('creates user and reservation on valid submit', async () => {
    mockGetUserByEmail.mockRejectedValue({ status: 404 })
    mockCreateUser.mockResolvedValue({ data: { id: 42, name: 'John', email: 'john@udea.edu.co' } })
    mockCreateReservation.mockResolvedValue({ data: { id: 1 } })

    const wrapper = mountForm()
    await wrapper.find('#rname').setValue('John')
    await wrapper.find('#remail').setValue('john@udea.edu.co')
    await wrapper.find('#rstart').setValue('2026-08-10T10:00')
    await wrapper.find('#rend').setValue('2026-08-10T12:00')
    await wrapper.find('form').trigger('submit.prevent')

    await wrapper.vm.$nextTick()
    await new Promise(r => setTimeout(r, 50))

    expect(mockCreateUser).toHaveBeenCalledWith({ name: 'John', email: 'john@udea.edu.co' })
    expect(mockCreateReservation).toHaveBeenCalled()
    expect(wrapper.text()).toContain('Reservation created successfully')
  })

  it('shows conflict message on 409', async () => {
    mockGetUserByEmail.mockResolvedValue({ data: { id: 42, name: 'John', email: 'john@udea.edu.co' } })
    mockCreateReservation.mockRejectedValue({ status: 409, message: 'Conflict' })

    const wrapper = mountForm()
    await wrapper.find('#rname').setValue('John')
    await wrapper.find('#remail').setValue('john@udea.edu.co')
    await wrapper.find('#rstart').setValue('2026-08-10T10:00')
    await wrapper.find('#rend').setValue('2026-08-10T12:00')
    await wrapper.find('form').trigger('submit.prevent')

    await wrapper.vm.$nextTick()
    await new Promise(r => setTimeout(r, 50))

    expect(wrapper.text()).toContain('already reserved')
  })

  it('disables submit button while submitting', async () => {
    mockGetUserByEmail.mockRejectedValue({ status: 404 })
    mockCreateUser.mockResolvedValue({ data: { id: 1 } })
    mockCreateReservation.mockImplementation(() => new Promise(r => setTimeout(() => r({ data: { id: 1 } }), 100)))

    const wrapper = mountForm()
    await wrapper.find('#rname').setValue('John')
    await wrapper.find('#remail').setValue('john@udea.edu.co')
    await wrapper.find('#rstart').setValue('2026-08-10T10:00')
    await wrapper.find('#rend').setValue('2026-08-10T12:00')
    await wrapper.find('form').trigger('submit.prevent')

    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined()
  })
})
