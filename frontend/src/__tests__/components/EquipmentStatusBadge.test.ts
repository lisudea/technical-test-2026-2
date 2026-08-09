import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import EquipmentStatusBadge from '../../components/EquipmentStatusBadge.vue'
import { EquipmentStatus } from '../../types/equipment'
import en from '../../i18n/en.json'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

describe('EquipmentStatusBadge', () => {
  it('renders Available with green class', () => {
    const wrapper = mount(EquipmentStatusBadge, {
      props: { status: EquipmentStatus.AVAILABLE },
      global: { plugins: [i18n] },
    })
    expect(wrapper.text()).toContain('Available')
    expect(wrapper.find('.bg-success').exists()).toBe(true)
  })

  it('renders Reserved with red class', () => {
    const wrapper = mount(EquipmentStatusBadge, {
      props: { status: EquipmentStatus.RESERVED },
      global: { plugins: [i18n] },
    })
    expect(wrapper.text()).toContain('Reserved')
    expect(wrapper.find('.bg-danger').exists()).toBe(true)
  })

  it('renders Maintenance with gray class', () => {
    const wrapper = mount(EquipmentStatusBadge, {
      props: { status: EquipmentStatus.MAINTENANCE },
      global: { plugins: [i18n] },
    })
    expect(wrapper.text()).toContain('Maintenance')
    expect(wrapper.find('.bg-secondary').exists()).toBe(true)
  })
})
