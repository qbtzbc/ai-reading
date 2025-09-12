import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StatusIndicator from '../components/StatusIndicator.vue'

describe('StatusIndicator', () => {
  it('renders message correctly', () => {
    const message = 'Test status message'
    const wrapper = mount(StatusIndicator, {
      props: {
        isActive: false,
        message
      }
    })

    expect(wrapper.text()).toContain(message)
  })

  it('applies active class when isActive is true', () => {
    const wrapper = mount(StatusIndicator, {
      props: {
        isActive: true,
        message: 'Active status'
      }
    })

    expect(wrapper.classes()).toContain('active')
  })

  it('applies correct type class', () => {
    const wrapper = mount(StatusIndicator, {
      props: {
        isActive: false,
        message: 'Warning message',
        type: 'warning'
      }
    })

    expect(wrapper.classes()).toContain('status-warning')
  })

  it('shows correct icon based on type', () => {
    const types = [
      { type: 'success', expectedIcon: '✅' },
      { type: 'warning', expectedIcon: '⚠️' },
      { type: 'error', expectedIcon: '❌' },
      { type: 'info', expectedIcon: 'ℹ️' }
    ] as const

    types.forEach(({ type, expectedIcon }) => {
      const wrapper = mount(StatusIndicator, {
        props: {
          isActive: false,
          message: 'Test message',
          type,
          showIcon: true
        }
      })

      expect(wrapper.text()).toContain(expectedIcon)
    })
  })

  it('hides icon when showIcon is false', () => {
    const wrapper = mount(StatusIndicator, {
      props: {
        isActive: false,
        message: 'Test message',
        type: 'success',
        showIcon: false
      }
    })

    expect(wrapper.find('.status-icon').exists()).toBe(false)
  })

  it('shows default icon when type is not specified', () => {
    const wrapper = mount(StatusIndicator, {
      props: {
        isActive: false,
        message: 'Test message',
        showIcon: true
      }
    })

    expect(wrapper.text()).toContain('📄')
  })
})