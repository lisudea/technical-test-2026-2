import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { createI18n } from 'vue-i18n'
import EquipmentCard from '../../components/EquipmentCard.vue'
import { EquipmentCategory, EquipmentStatus } from '../../types/equipment'
import en from '../../i18n/en.json'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })
const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/equipment/:id', name: 'equipment-detail', component: {} as any }],
})

function mountCard(overrides = {}) {
  const equipment = {
    id: 1,
    name: 'Arduino Uno',
    serialNumber: 'SN-001',
    macAddress: null,
    category: EquipmentCategory.MICROCONTROLLERS,
    status: EquipmentStatus.AVAILABLE,
    createdAt: '2026-01-01T00:00:00',
    updatedAt: '2026-01-01T00:00:00',
    ...overrides,
  }
  return mount(EquipmentCard, {
    props: { equipment },
    global: { plugins: [i18n, router] },
  })
}

describe('EquipmentCard', () => {
  it('renders equipment name', () => {
    const wrapper = mountCard()
    expect(wrapper.text()).toContain('Arduino Uno')
  })

  it('renders serial number', () => {
    const wrapper = mountCard()
    expect(wrapper.text()).toContain('SN-001')
  })

  it('renders category', () => {
    const wrapper = mountCard()
    expect(wrapper.text()).toContain('MICROCONTROLLERS')
  })

  it('shows View Details link', () => {
    const wrapper = mountCard()
    expect(wrapper.text()).toContain('View Details')
  })

  it('shows Available badge for available equipment', () => {
    const wrapper = mountCard()
    expect(wrapper.text()).toContain('Available')
    expect(wrapper.find('.bg-success').exists()).toBe(true)
  })

  it('shows Reserved badge for reserved equipment', () => {
    const wrapper = mountCard({ status: EquipmentStatus.RESERVED })
    expect(wrapper.text()).toContain('Reserved')
    expect(wrapper.find('.bg-danger').exists()).toBe(true)
  })

  it('shows Maintenance badge for maintenance equipment', () => {
    const wrapper = mountCard({ status: EquipmentStatus.MAINTENANCE })
    expect(wrapper.text()).toContain('Maintenance')
    expect(wrapper.find('.bg-secondary').exists()).toBe(true)
  })

  it('has a View Details link pointing to equipment detail', () => {
    const wrapper = mountCard()
    const link = wrapper.findComponent({ name: 'RouterLink' })
    expect(link.exists()).toBe(true)
  })
})
