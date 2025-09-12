import { ref, onMounted, onUnmounted } from 'vue'
import type { UseSettingsReturn, UserSettings } from '@/types'
import { DEFAULT_USER_SETTINGS, SettingsError } from '@/types'

export function useSettings(): UseSettingsReturn {
  const settings = ref<UserSettings>({ ...DEFAULT_USER_SETTINGS })
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 加载设置
  const loadSettings = async (): Promise<void> => {
    loading.value = true
    error.value = null

    try {
      const result = await chrome.storage.sync.get('userSettings')
      settings.value = { ...DEFAULT_USER_SETTINGS, ...result.userSettings }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load settings'
      error.value = errorMessage
      console.error('Failed to load settings:', err)
      throw new SettingsError(errorMessage, err)
    } finally {
      loading.value = false
    }
  }

  // 保存设置
  const saveSettings = async (newSettings: Partial<UserSettings>): Promise<void> => {
    loading.value = true
    error.value = null

    try {
      // 合并新设置与当前设置
      const updatedSettings = { ...settings.value, ...newSettings }
      
      // 验证设置
      validateSettings(updatedSettings)
      
      // 保存到 Chrome storage
      await chrome.storage.sync.set({ userSettings: updatedSettings })
      
      // 更新本地状态
      settings.value = updatedSettings
      
      // 通知其他组件设置已更新
      await notifySettingsChange(newSettings)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save settings'
      error.value = errorMessage
      console.error('Failed to save settings:', err)
      throw new SettingsError(errorMessage, err)
    } finally {
      loading.value = false
    }
  }

  // 重置设置
  const resetSettings = async (): Promise<void> => {
    try {
      await saveSettings(DEFAULT_USER_SETTINGS)
    } catch (err) {
      console.error('Failed to reset settings:', err)
      throw err
    }
  }

  // 导出设置
  const exportSettings = async (): Promise<string> => {
    try {
      const exportData = {
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        settings: settings.value
      }
      return JSON.stringify(exportData, null, 2)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export settings'
      console.error('Failed to export settings:', err)
      throw new SettingsError(errorMessage, err)
    }
  }

  // 导入设置
  const importSettings = async (data: string): Promise<void> => {
    try {
      const importData = JSON.parse(data)
      
      // 验证导入数据格式
      if (!importData.settings) {
        throw new Error('Invalid import data format')
      }
      
      // 验证设置数据
      validateSettings(importData.settings)
      
      // 保存导入的设置
      await saveSettings(importData.settings)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import settings'
      console.error('Failed to import settings:', err)
      throw new SettingsError(errorMessage, err)
    }
  }

  // 验证设置
  const validateSettings = (settingsToValidate: UserSettings): void => {
    // 语速验证
    if (settingsToValidate.speechRate < 0.5 || settingsToValidate.speechRate > 2.0) {
      throw new Error('Speech rate must be between 0.5 and 2.0')
    }
    
    // 音量验证
    if (settingsToValidate.volume < 0 || settingsToValidate.volume > 1) {
      throw new Error('Volume must be between 0 and 1')
    }
    
    // 收藏语音验证
    if (!Array.isArray(settingsToValidate.favoriteVoices)) {
      throw new Error('Favorite voices must be an array')
    }
  }

  // 通知设置变更
  const notifySettingsChange = async (changedSettings: Partial<UserSettings>): Promise<void> => {
    try {
      // 向 content script 发送设置更新消息
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
      if (tabs[0]?.id) {
        await chrome.tabs.sendMessage(tabs[0].id, {
          type: 'UPDATE_SETTINGS',
          data: changedSettings,
          timestamp: Date.now(),
          id: `settings_${Date.now()}`
        })
      }
    } catch (err) {
      // 静默处理通知失败，不影响设置保存
      console.warn('Failed to notify settings change:', err)
    }
  }

  // 监听来自其他组件的设置变更
  const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
    if (changes.userSettings) {
      settings.value = { ...DEFAULT_USER_SETTINGS, ...changes.userSettings.newValue }
    }
  }

  // 组件挂载时初始化
  onMounted(() => {
    loadSettings()
    chrome.storage.onChanged.addListener(handleStorageChange)
  })

  // 组件卸载时清理
  onUnmounted(() => {
    chrome.storage.onChanged.removeListener(handleStorageChange)
  })

  return {
    settings,
    loading,
    error,
    loadSettings,
    saveSettings,
    resetSettings,
    exportSettings,
    importSettings
  }
}