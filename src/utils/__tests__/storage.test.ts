import { describe, it, expect, beforeEach, vi } from 'vitest'
import { StorageManager, DEFAULT_SETTINGS, UserSettings, ReadingProgress, SiteRule } from '../storage'

// Mock Chrome APIs
const mockChromeStorage = {
  sync: {
    get: vi.fn(),
    set: vi.fn(),
    clear: vi.fn()
  },
  local: {
    get: vi.fn(),
    set: vi.fn(),
    clear: vi.fn()
  }
}

// @ts-ignore
global.chrome = {
  storage: mockChromeStorage
}

describe('StorageManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getUserSettings', () => {
    it('should return default settings when no stored settings', async () => {
      mockChromeStorage.sync.get.mockResolvedValue({})
      
      const settings = await StorageManager.getUserSettings()
      expect(settings).toEqual(DEFAULT_SETTINGS)
    })

    it('should merge stored settings with defaults', async () => {
      const storedSettings = { speechRate: 1.5 }
      mockChromeStorage.sync.get.mockResolvedValue({ userSettings: storedSettings })
      
      const settings = await StorageManager.getUserSettings()
      expect(settings).toEqual({
        ...DEFAULT_SETTINGS,
        speechRate: 1.5
      })
    })

    it('should handle storage errors', async () => {
      mockChromeStorage.sync.get.mockRejectedValue(new Error('Storage error'))
      
      const settings = await StorageManager.getUserSettings()
      expect(settings).toEqual(DEFAULT_SETTINGS)
    })
  })

  describe('saveUserSettings', () => {
    it('should save settings correctly', async () => {
      const currentSettings = DEFAULT_SETTINGS
      mockChromeStorage.sync.get.mockResolvedValue({ userSettings: currentSettings })
      mockChromeStorage.sync.set.mockResolvedValue(undefined)

      const newSettings = { speechRate: 2.0 }
      await StorageManager.saveUserSettings(newSettings)

      expect(mockChromeStorage.sync.set).toHaveBeenCalledWith({
        userSettings: {
          ...currentSettings,
          ...newSettings
        }
      })
    })

    it('should handle save errors', async () => {
      mockChromeStorage.sync.get.mockResolvedValue({ userSettings: DEFAULT_SETTINGS })
      mockChromeStorage.sync.set.mockRejectedValue(new Error('Save error'))

      await expect(StorageManager.saveUserSettings({ speechRate: 2.0 }))
        .rejects.toThrow('Save error')
    })
  })

  describe('getReadingProgress', () => {
    it('should return progress for existing URL', async () => {
      const progress: ReadingProgress = {
        url: 'https://example.com/novel',
        position: 10,
        timestamp: '2024-01-01T00:00:00.000Z',
        title: 'Test Novel'
      }
      
      mockChromeStorage.local.get.mockResolvedValue({
        'progress_https://example.com/novel': progress
      })

      const result = await StorageManager.getReadingProgress('https://example.com/novel')
      expect(result).toEqual(progress)
    })

    it('should return null for non-existing URL', async () => {
      mockChromeStorage.local.get.mockResolvedValue({})

      const result = await StorageManager.getReadingProgress('https://example.com/novel')
      expect(result).toBeNull()
    })

    it('should handle storage errors', async () => {
      mockChromeStorage.local.get.mockRejectedValue(new Error('Storage error'))

      const result = await StorageManager.getReadingProgress('https://example.com/novel')
      expect(result).toBeNull()
    })
  })

  describe('saveReadingProgress', () => {
    it('should save progress correctly', async () => {
      const progress: ReadingProgress = {
        url: 'https://example.com/novel',
        position: 10,
        timestamp: '2024-01-01T00:00:00.000Z',
        title: 'Test Novel'
      }

      mockChromeStorage.local.set.mockResolvedValue(undefined)

      await StorageManager.saveReadingProgress(progress)

      expect(mockChromeStorage.local.set).toHaveBeenCalledWith({
        'progress_https://example.com/novel': progress
      })
    })

    it('should handle save errors', async () => {
      const progress: ReadingProgress = {
        url: 'https://example.com/novel',
        position: 10,
        timestamp: '2024-01-01T00:00:00.000Z',
        title: 'Test Novel'
      }

      mockChromeStorage.local.set.mockRejectedValue(new Error('Save error'))

      await expect(StorageManager.saveReadingProgress(progress))
        .rejects.toThrow('Save error')
    })
  })

  describe('getSiteRules', () => {
    it('should return site rules', async () => {
      const rules: SiteRule[] = [
        {
          domain: 'example.com',
          titleSelector: '.title',
          contentSelector: '.content',
          enabled: true
        }
      ]

      mockChromeStorage.local.get.mockResolvedValue({ siteRules: rules })

      const result = await StorageManager.getSiteRules()
      expect(result).toEqual(rules)
    })

    it('should return empty array when no rules', async () => {
      mockChromeStorage.local.get.mockResolvedValue({})

      const result = await StorageManager.getSiteRules()
      expect(result).toEqual([])
    })
  })

  describe('saveSiteRules', () => {
    it('should save site rules correctly', async () => {
      const rules: SiteRule[] = [
        {
          domain: 'example.com',
          titleSelector: '.title',
          contentSelector: '.content',
          enabled: true
        }
      ]

      mockChromeStorage.local.set.mockResolvedValue(undefined)

      await StorageManager.saveSiteRules(rules)

      expect(mockChromeStorage.local.set).toHaveBeenCalledWith({
        siteRules: rules
      })
    })
  })

  describe('clearAllData', () => {
    it('should clear all storage', async () => {
      mockChromeStorage.local.clear.mockResolvedValue(undefined)
      mockChromeStorage.sync.clear.mockResolvedValue(undefined)

      await StorageManager.clearAllData()

      expect(mockChromeStorage.local.clear).toHaveBeenCalled()
      expect(mockChromeStorage.sync.clear).toHaveBeenCalled()
    })

    it('should handle clear errors', async () => {
      mockChromeStorage.local.clear.mockRejectedValue(new Error('Clear error'))

      await expect(StorageManager.clearAllData())
        .rejects.toThrow('Clear error')
    })
  })
})