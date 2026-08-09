import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import EquipmentFilters from '../../components/EquipmentFilters.vue'
import en from '../../i18n/en.json'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

describe('EquipmentFilters', () => {
  it('renders category and status select elements', () => {
    const wrapper = mount(EquipmentFilters, {
      global: { plugins: [i18n] },
    })
    const selects = wrapper.findAll('select')
    expect(selects.length).toBe(2)
  })

  it('renders a Clear button', () => {
    const wrapper = mount(EquipmentFilters, {
      global: { plugins: [i18n] },
    })
    expect(wrapper.find('button').text()).toContain('Clear')
  })

  it('has default options All Categories and All Statuses', () => {
    const wrapper = mount(EquipmentFilters, {
      global: { plugins: [i18n] },
    })
    expect(wrapper.text()).toContain('All Categories')
    expect(wrapper.text()).toContain('All Statuses')
  })
})
