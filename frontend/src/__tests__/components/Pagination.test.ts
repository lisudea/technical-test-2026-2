import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import Pagination from '../../components/Pagination.vue'
import en from '../../i18n/en.json'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

describe('Pagination', () => {
  it('does not render when totalPages is 1', () => {
    const wrapper = mount(Pagination, {
      props: { page: 0, totalPages: 1, first: true, last: true },
      global: { plugins: [i18n] },
    })
    expect(wrapper.find('nav').exists()).toBe(false)
  })

  it('renders when totalPages > 1', () => {
    const wrapper = mount(Pagination, {
      props: { page: 0, totalPages: 3, first: true, last: false },
      global: { plugins: [i18n] },
    })
    expect(wrapper.find('nav').exists()).toBe(true)
  })

  it('disables Previous on first page', () => {
    const wrapper = mount(Pagination, {
      props: { page: 0, totalPages: 3, first: true, last: false },
      global: { plugins: [i18n] },
    })
    const prev = wrapper.findAll('button').find(b => b.text() === 'Previous')
    expect(prev?.attributes('disabled')).toBeDefined()
  })

  it('disables Next on last page', () => {
    const wrapper = mount(Pagination, {
      props: { page: 2, totalPages: 3, first: false, last: true },
      global: { plugins: [i18n] },
    })
    const next = wrapper.findAll('button').find(b => b.text() === 'Next')
    expect(next?.attributes('disabled')).toBeDefined()
  })

  it('emits update:page when clicking a page number', async () => {
    const wrapper = mount(Pagination, {
      props: { page: 0, totalPages: 3, first: true, last: false },
      global: { plugins: [i18n] },
    })
    await wrapper.findAll('button').find(b => b.text() === '2')?.trigger('click')
    expect(wrapper.emitted('update:page')).toBeTruthy()
    expect(wrapper.emitted('update:page')![0]).toEqual([1])
  })
})
