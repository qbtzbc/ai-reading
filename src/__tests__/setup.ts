// Vitest setup file
import { vi } from 'vitest'

// Mock Chrome APIs globally
const mockChrome = {
  storage: {
    sync: {
      get: vi.fn(),
      set: vi.fn(),
      clear: vi.fn(),
      onChanged: {
        addListener: vi.fn(),
        removeListener: vi.fn()
      }
    },
    local: {
      get: vi.fn(),
      set: vi.fn(),
      clear: vi.fn(),
      onChanged: {
        addListener: vi.fn(),
        removeListener: vi.fn()
      }
    },
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn()
    }
  },
  runtime: {
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn()
    },
    getURL: vi.fn(),
    openOptionsPage: vi.fn(),
    getManifest: vi.fn().mockReturnValue({ version: '2.0.0' })
  },
  tabs: {
    query: vi.fn(),
    sendMessage: vi.fn(),
    create: vi.fn(),
    onActivated: {
      addListener: vi.fn()
    },
    onUpdated: {
      addListener: vi.fn()
    }
  },
  action: {
    setIcon: vi.fn()
  }
}

// @ts-ignore
global.chrome = mockChrome

// Mock Speech Synthesis API
const mockSpeechSynthesis = {
  getVoices: vi.fn().mockReturnValue([]),
  speak: vi.fn(),
  cancel: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  pending: false,
  speaking: false,
  paused: false
}

const mockSpeechSynthesisUtterance = vi.fn().mockImplementation(() => ({
  text: '',
  voice: null,
  rate: 1,
  volume: 1,
  pitch: 1,
  lang: 'zh-CN',
  onstart: null,
  onend: null,
  onerror: null,
  onpause: null,
  onresume: null,
  onmark: null,
  onboundary: null
}))

// @ts-ignore
global.speechSynthesis = mockSpeechSynthesis
// @ts-ignore
global.SpeechSynthesisUtterance = mockSpeechSynthesisUtterance

// Mock DOM APIs
Object.defineProperty(global, 'NodeFilter', {
  value: {
    SHOW_TEXT: 4,
    SHOW_ELEMENT: 1
  },
  writable: true
})

Object.defineProperty(global, 'Node', {
  value: {
    ELEMENT_NODE: 1,
    TEXT_NODE: 3,
    COMMENT_NODE: 8
  },
  writable: true
})

// Mock URL for blob operations
Object.defineProperty(global, 'URL', {
  value: {
    createObjectURL: vi.fn(),
    revokeObjectURL: vi.fn()
  },
  writable: true
})

// Mock Blob
Object.defineProperty(global, 'Blob', {
  value: vi.fn().mockImplementation((content, options) => ({
    size: content[0]?.length || 0,
    type: options?.type || 'text/plain'
  })),
  writable: true
})

// Mock fetch for testing
Object.defineProperty(global, 'fetch', {
  value: vi.fn(),
  writable: true
})

// Mock console methods to reduce noise in tests
console.warn = vi.fn()
console.error = vi.fn()