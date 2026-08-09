import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import LoadingState from '../../components/LoadingState.vue'
import EmptyState from '../../components/EmptyState.vue'
import ErrorAlert from '../../components/ErrorAlert.vue'
import en from '../../i18n/en.json'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

describe('LoadingState', () => {
  it('renders default loading text', () => {
    const wrapper = mount(LoadingState, { global: { plugins: [i18n] } })
    expect(wrapper.text()).toContain('Loading...')
  })

  it('renders custom message', () => {
    const wrapper = mount(LoadingState, {
      props: { message: 'Please wait...' },
      global: { plugins: [i18n] },
    })
    expect(wrapper.text()).toContain('Please wait...')
  })
})

describe('EmptyState', () => {
  it('renders default empty text', () => {
    const wrapper = mount(EmptyState, { global: { plugins: [i18n] } })
    expect(wrapper.text()).toContain('No data found.')
  })

  it('renders custom message', () => {
    const wrapper = mount(EmptyState, {
      props: { message: 'Nothing here.' },
      global: { plugins: [i18n] },
    })
    expect(wrapper.text()).toContain('Nothing here.')
  })
})

describe('ErrorAlert', () => {
  it('renders error message', () => {
    const wrapper = mount(ErrorAlert, {
      props: { message: 'Something went wrong.' },
      global: { plugins: [i18n] },
    })
    expect(wrapper.text()).toContain('Something went wrong.')
  })

  it('renders Retry button', () => {
    const wrapper = mount(ErrorAlert, {
      props: { message: 'Error' },
      global: { plugins: [i18n] },
    })
    expect(wrapper.find('button').text()).toContain('Retry')
  })

  it('emits retry when button is clicked', async () => {
    const wrapper = mount(ErrorAlert, {
      props: { message: 'Error' },
      global: { plugins: [i18n] },
    })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('retry')).toBeTruthy()
  })
})
