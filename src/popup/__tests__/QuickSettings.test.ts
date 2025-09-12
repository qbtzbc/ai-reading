import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import QuickSettings from '../components/QuickSettings.vue'

describe('QuickSettings', () => {
  it('renders speech rate slider with correct value', () => {
    const wrapper = mount(QuickSettings, {
      props: {
        speechRate: 1.5,
        volume: 0.8
      }
    })

    const speechRateSlider = wrapper.find('#speech-rate-slider')
    expect(speechRateSlider.element.value).toBe('1.5')
    expect(wrapper.text()).toContain('1.5x')
  })

  it('renders volume slider with correct value', () => {
    const wrapper = mount(QuickSettings, {
      props: {
        speechRate: 1.0,
        volume: 0.6
      }
    })

    const volumeSlider = wrapper.find('#volume-slider')
    expect(volumeSlider.element.value).toBe('0.6')
    expect(wrapper.text()).toContain('60%')
  })

  it('emits speech rate change events', async () => {
    const wrapper = mount(QuickSettings, {
      props: {
        speechRate: 1.0,
        volume: 0.8
      }
    })

    const speechRateSlider = wrapper.find('#speech-rate-slider')
    await speechRateSlider.setValue('1.8')

    expect(wrapper.emitted('update:speechRate')).toBeTruthy()
    expect(wrapper.emitted('update:speechRate')?.[0]).toEqual([1.8])
    expect(wrapper.emitted('speechRateChange')).toBeTruthy()
    expect(wrapper.emitted('speechRateChange')?.[0]).toEqual([1.8])
  })

  it('emits volume change events', async () => {
    const wrapper = mount(QuickSettings, {
      props: {
        speechRate: 1.0,
        volume: 0.8
      }
    })

    const volumeSlider = wrapper.find('#volume-slider')
    await volumeSlider.setValue('0.5')

    expect(wrapper.emitted('update:volume')).toBeTruthy()
    expect(wrapper.emitted('update:volume')?.[0]).toEqual([0.5])
    expect(wrapper.emitted('volumeChange')).toBeTruthy()
    expect(wrapper.emitted('volumeChange')?.[0]).toEqual([0.5])
  })

  it('shows pitch control when showAdvanced is true', () => {
    const wrapper = mount(QuickSettings, {
      props: {
        speechRate: 1.0,
        volume: 0.8,
        pitch: 1.2,
        showAdvanced: true
      }
    })

    const pitchSlider = wrapper.find('#pitch-slider')
    expect(pitchSlider.exists()).toBe(true)
    expect(pitchSlider.element.value).toBe('1.2')
    expect(wrapper.text()).toContain('1.2')
  })

  it('hides pitch control when showAdvanced is false', () => {
    const wrapper = mount(QuickSettings, {
      props: {
        speechRate: 1.0,
        volume: 0.8,
        showAdvanced: false
      }
    })

    const pitchSlider = wrapper.find('#pitch-slider')
    expect(pitchSlider.exists()).toBe(false)
  })

  it('emits pitch change events when advanced mode is enabled', async () => {
    const wrapper = mount(QuickSettings, {
      props: {
        speechRate: 1.0,
        volume: 0.8,
        pitch: 1.0,
        showAdvanced: true
      }
    })

    const pitchSlider = wrapper.find('#pitch-slider')
    await pitchSlider.setValue('1.5')

    expect(wrapper.emitted('update:pitch')).toBeTruthy()
    expect(wrapper.emitted('update:pitch')?.[0]).toEqual([1.5])
    expect(wrapper.emitted('pitchChange')).toBeTruthy()
    expect(wrapper.emitted('pitchChange')?.[0]).toEqual([1.5])
  })

  it('displays correct volume percentage', () => {
    const wrapper = mount(QuickSettings, {
      props: {
        speechRate: 1.0,
        volume: 0.75
      }
    })

    expect(wrapper.text()).toContain('75%')
  })

  it('formats speech rate display correctly', () => {
    const wrapper = mount(QuickSettings, {
      props: {
        speechRate: 1.234,
        volume: 0.8
      }
    })

    expect(wrapper.text()).toContain('1.2x')
  })

  it('has correct slider attributes', () => {
    const wrapper = mount(QuickSettings, {
      props: {
        speechRate: 1.0,
        volume: 0.8
      }
    })

    const speechRateSlider = wrapper.find('#speech-rate-slider')
    expect(speechRateSlider.attributes('min')).toBe('0.5')
    expect(speechRateSlider.attributes('max')).toBe('2.0')
    expect(speechRateSlider.attributes('step')).toBe('0.1')

    const volumeSlider = wrapper.find('#volume-slider')
    expect(volumeSlider.attributes('min')).toBe('0')
    expect(volumeSlider.attributes('max')).toBe('1')
    expect(volumeSlider.attributes('step')).toBe('0.1')
  })
})