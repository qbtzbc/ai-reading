import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ProgressBar from '../components/ProgressBar.vue'

describe('ProgressBar', () => {
  it('displays current and total progress correctly', () => {
    const wrapper = mount(ProgressBar, {
      props: {
        current: 25,
        total: 100
      }
    })

    expect(wrapper.text()).toContain('25')
    expect(wrapper.text()).toContain('100')
  })

  it('calculates percentage correctly when not provided', () => {
    const wrapper = mount(ProgressBar, {
      props: {
        current: 30,
        total: 120
      }
    })

    expect(wrapper.text()).toContain('25%') // 30/120 * 100 = 25%
  })

  it('uses provided percentage when available', () => {
    const wrapper = mount(ProgressBar, {
      props: {
        current: 30,
        total: 120,
        percentage: 50
      }
    })

    expect(wrapper.text()).toContain('50%')
    const progressFill = wrapper.find('.progress-fill')
    expect(progressFill.attributes('style')).toContain('width: 50%')
  })

  it('shows estimated time when provided and showTime is true', () => {
    const wrapper = mount(ProgressBar, {
      props: {
        current: 25,
        total: 100,
        estimatedTime: 300, // 5 minutes
        showTime: true
      }
    })

    expect(wrapper.text()).toContain('剩余 5:00')
  })

  it('formats time correctly for hours', () => {
    const wrapper = mount(ProgressBar, {
      props: {
        current: 25,
        total: 100,
        estimatedTime: 3665, // 1 hour, 1 minute, 5 seconds
        showTime: true
      }
    })

    expect(wrapper.text()).toContain('剩余 1:01:05')
  })

  it('does not show time when showTime is false', () => {
    const wrapper = mount(ProgressBar, {
      props: {
        current: 25,
        total: 100,
        estimatedTime: 300,
        showTime: false
      }
    })

    expect(wrapper.text()).not.toContain('剩余')
  })

  it('emits seek event when progress bar is clicked', async () => {
    const wrapper = mount(ProgressBar, {
      props: {
        current: 25,
        total: 100,
        interactive: true
      }
    })

    // Mock getBoundingClientRect
    const progressBar = wrapper.find('.progress-bar')
    const mockElement = progressBar.element as HTMLElement
    mockElement.getBoundingClientRect = vi.fn().mockReturnValue({
      left: 0,
      width: 200
    })

    // Simulate click at 50% position
    await progressBar.trigger('click', {
      clientX: 100
    })

    expect(wrapper.emitted('seek')).toBeTruthy()
    expect(wrapper.emitted('seek')?.[0]).toEqual([50]) // 50% of 100 total
  })

  it('does not emit seek when interactive is false', async () => {
    const wrapper = mount(ProgressBar, {
      props: {
        current: 25,
        total: 100,
        interactive: false
      }
    })

    const progressBar = wrapper.find('.progress-bar')
    await progressBar.trigger('click')

    expect(wrapper.emitted('seek')).toBeFalsy()
  })

  it('handles zero total correctly', () => {
    const wrapper = mount(ProgressBar, {
      props: {
        current: 0,
        total: 0
      }
    })

    expect(wrapper.text()).toContain('0%')
    const progressFill = wrapper.find('.progress-fill')
    expect(progressFill.attributes('style')).toContain('width: 0%')
  })

  it('constrains seek position within bounds', async () => {
    const wrapper = mount(ProgressBar, {
      props: {
        current: 25,
        total: 100,
        interactive: true
      }
    })

    const progressBar = wrapper.find('.progress-bar')
    const mockElement = progressBar.element as HTMLElement
    mockElement.getBoundingClientRect = vi.fn().mockReturnValue({
      left: 0,
      width: 200
    })

    // Simulate click beyond bounds
    await progressBar.trigger('click', {
      clientX: 250 // Beyond width
    })

    expect(wrapper.emitted('seek')?.[0]).toEqual([100]) // Constrained to max
  })
})