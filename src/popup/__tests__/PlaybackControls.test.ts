import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import PlaybackControls from '../components/PlaybackControls.vue'

describe('PlaybackControls', () => {
  it('shows play button when not reading', () => {
    const wrapper = mount(PlaybackControls, {
      props: {
        isReading: false,
        isPaused: false
      }
    })

    expect(wrapper.find('button').text()).toContain('播放')
    expect(wrapper.find('button').text()).toContain('▶️')
  })

  it('shows pause button when reading and not paused', () => {
    const wrapper = mount(PlaybackControls, {
      props: {
        isReading: true,
        isPaused: false
      }
    })

    const buttons = wrapper.findAll('button')
    const pauseButton = buttons.find(btn => btn.text().includes('暂停'))
    expect(pauseButton).toBeTruthy()
    expect(pauseButton?.text()).toContain('⏸️')
  })

  it('shows resume button when reading and paused', () => {
    const wrapper = mount(PlaybackControls, {
      props: {
        isReading: true,
        isPaused: true
      }
    })

    const buttons = wrapper.findAll('button')
    const resumeButton = buttons.find(btn => btn.text().includes('继续'))
    expect(resumeButton).toBeTruthy()
    expect(resumeButton?.text()).toContain('▶️')
  })

  it('emits play event when play button is clicked', async () => {
    const wrapper = mount(PlaybackControls, {
      props: {
        isReading: false,
        isPaused: false
      }
    })

    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('play')).toBeTruthy()
  })

  it('emits pause event when pause button is clicked', async () => {
    const wrapper = mount(PlaybackControls, {
      props: {
        isReading: true,
        isPaused: false
      }
    })

    const buttons = wrapper.findAll('button')
    const pauseButton = buttons.find(btn => btn.text().includes('暂停'))
    await pauseButton?.trigger('click')
    expect(wrapper.emitted('pause')).toBeTruthy()
  })

  it('emits resume event when resume button is clicked', async () => {
    const wrapper = mount(PlaybackControls, {
      props: {
        isReading: true,
        isPaused: true
      }
    })

    const buttons = wrapper.findAll('button')
    const resumeButton = buttons.find(btn => btn.text().includes('继续'))
    await resumeButton?.trigger('click')
    expect(wrapper.emitted('resume')).toBeTruthy()
  })

  it('emits stop event when stop button is clicked', async () => {
    const wrapper = mount(PlaybackControls, {
      props: {
        isReading: true,
        isPaused: false,
        hasProgress: true
      }
    })

    const buttons = wrapper.findAll('button')
    const stopButton = buttons.find(btn => btn.text().includes('停止'))
    await stopButton?.trigger('click')
    expect(wrapper.emitted('stop')).toBeTruthy()
  })

  it('disables buttons when disabled prop is true', () => {
    const wrapper = mount(PlaybackControls, {
      props: {
        isReading: false,
        isPaused: false,
        disabled: true
      }
    })

    const buttons = wrapper.findAll('button')
    buttons.forEach(button => {
      expect(button.element.disabled).toBe(true)
    })
  })

  it('disables stop button when no progress and not reading', () => {
    const wrapper = mount(PlaybackControls, {
      props: {
        isReading: false,
        isPaused: false,
        hasProgress: false
      }
    })

    const buttons = wrapper.findAll('button')
    const stopButton = buttons.find(btn => btn.text().includes('停止'))
    expect(stopButton?.element.disabled).toBe(true)
  })
})