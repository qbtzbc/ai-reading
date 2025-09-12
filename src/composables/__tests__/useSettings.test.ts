import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useSettings } from '../useSettings'
import { DEFAULT_USER_SETTINGS } from '@/types'

// Mock Chrome APIs
const mockChromeStorage = {
  sync: {
    get: vi.fn(),
    set: vi.fn(),
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn()
    }
  },
  onChanged: {
    addListener: vi.fn(),
    removeListener: vi.fn()
  }
}

// @ts-ignore
global.chrome = {
  storage: mockChromeStorage
}

describe('useSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with default settings', () => {
    const { settings } = useSettings()
    expect(settings.value).toEqual(DEFAULT_USER_SETTINGS)
  })

  it('loads settings from storage', async () => {
    const storedSettings = { speechRate: 1.5, volume: 0.6 }
    mockChromeStorage.sync.get.mockResolvedValue({ userSettings: storedSettings })

    const { loadSettings, settings } = useSettings()
    await loadSettings()

    expect(settings.value).toEqual({
      ...DEFAULT_USER_SETTINGS,
      ...storedSettings
    })
  })

  it('saves settings to storage', async () => {
    mockChromeStorage.sync.get.mockResolvedValue({ userSettings: DEFAULT_USER_SETTINGS })
    mockChromeStorage.sync.set.mockResolvedValue(undefined)

    const { saveSettings, settings } = useSettings()
    const newSettings = { speechRate: 2.0 }
    
    await saveSettings(newSettings)

    expect(mockChromeStorage.sync.set).toHaveBeenCalledWith({
      userSettings: {
        ...DEFAULT_USER_SETTINGS,
        ...newSettings
      }
    })
  })

  it('validates settings before saving', async () => {
    const { saveSettings } = useSettings()
    
    // Test invalid speech rate
    await expect(saveSettings({ speechRate: 3.0 })).rejects.toThrow()
    
    // Test invalid volume
    await expect(saveSettings({ volume: 1.5 })).rejects.toThrow()
  })

  it('exports settings correctly', async () => {
    const { exportSettings, settings } = useSettings()
    settings.value = { ...DEFAULT_USER_SETTINGS, speechRate: 1.5 }
    
    const exportData = await exportSettings()
    const parsed = JSON.parse(exportData)
    
    expect(parsed.version).toBe('2.0.0')
    expect(parsed.settings).toEqual(settings.value)
    expect(parsed.timestamp).toBeTruthy()
  })

  it('imports settings correctly', async () => {
    mockChromeStorage.sync.get.mockResolvedValue({ userSettings: DEFAULT_USER_SETTINGS })
    mockChromeStorage.sync.set.mockResolvedValue(undefined)

    const { importSettings } = useSettings()
    const importData = {
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      settings: { ...DEFAULT_USER_SETTINGS, speechRate: 1.8 }
    }
    
    await importSettings(JSON.stringify(importData))
    
    expect(mockChromeStorage.sync.set).toHaveBeenCalledWith({
      userSettings: importData.settings
    })
  })

  it('rejects invalid import data', async () => {
    const { importSettings } = useSettings()
    
    // Test invalid JSON
    await expect(importSettings('invalid json')).rejects.toThrow()
    
    // Test missing settings
    await expect(importSettings('{}')).rejects.toThrow()
  })

  it('resets settings to defaults', async () => {
    mockChromeStorage.sync.get.mockResolvedValue({ userSettings: DEFAULT_USER_SETTINGS })
    mockChromeStorage.sync.set.mockResolvedValue(undefined)

    const { resetSettings } = useSettings()
    await resetSettings()
    
    expect(mockChromeStorage.sync.set).toHaveBeenCalledWith({
      userSettings: DEFAULT_USER_SETTINGS
    })
  })

  it('handles storage errors gracefully', async () => {
    mockChromeStorage.sync.get.mockRejectedValue(new Error('Storage error'))
    
    const { loadSettings, settings, error } = useSettings()
    await loadSettings()
    
    expect(settings.value).toEqual(DEFAULT_USER_SETTINGS)
    expect(error.value).toBeTruthy()
  })
})