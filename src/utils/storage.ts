// 用户设置接口
export interface UserSettings {
  voiceType: string;
  speechRate: number;
  volume: number;
  autoDetect: boolean;
  favoriteVoices: string[];
}

// 阅读进度接口
export interface ReadingProgress {
  url: string;
  position: number;
  timestamp: string;
  title: string;
}

// 网站规则接口
export interface SiteRule {
  domain: string;
  titleSelector: string;
  contentSelector: string;
  enabled: boolean;
}

// 默认设置
export const DEFAULT_SETTINGS: UserSettings = {
  voiceType: '',
  speechRate: 1.0,
  volume: 0.8,
  autoDetect: true,
  favoriteVoices: [],
};

// 存储工具类
export class StorageManager {
  // 获取用户设置
  static async getUserSettings(): Promise<UserSettings> {
    try {
      const result = await chrome.storage.sync.get('userSettings');
      return { ...DEFAULT_SETTINGS, ...result.userSettings };
    } catch (error) {
      console.error('Failed to get user settings:', error);
      return DEFAULT_SETTINGS;
    }
  }

  // 保存用户设置
  static async saveUserSettings(settings: Partial<UserSettings>): Promise<void> {
    try {
      const currentSettings = await this.getUserSettings();
      const updatedSettings = { ...currentSettings, ...settings };
      await chrome.storage.sync.set({ userSettings: updatedSettings });
    } catch (error) {
      console.error('Failed to save user settings:', error);
      throw error;
    }
  }

  // 获取阅读进度
  static async getReadingProgress(url: string): Promise<ReadingProgress | null> {
    try {
      const result = await chrome.storage.local.get(`progress_${url}`);
      return result[`progress_${url}`] || null;
    } catch (error) {
      console.error('Failed to get reading progress:', error);
      return null;
    }
  }

  // 保存阅读进度
  static async saveReadingProgress(progress: ReadingProgress): Promise<void> {
    try {
      await chrome.storage.local.set({
        [`progress_${progress.url}`]: progress,
      });
    } catch (error) {
      console.error('Failed to save reading progress:', error);
      throw error;
    }
  }

  // 获取网站规则
  static async getSiteRules(): Promise<SiteRule[]> {
    try {
      const result = await chrome.storage.local.get('siteRules');
      return result.siteRules || [];
    } catch (error) {
      console.error('Failed to get site rules:', error);
      return [];
    }
  }

  // 保存网站规则
  static async saveSiteRules(rules: SiteRule[]): Promise<void> {
    try {
      await chrome.storage.local.set({ siteRules: rules });
    } catch (error) {
      console.error('Failed to save site rules:', error);
      throw error;
    }
  }

  // 清除所有数据
  static async clearAllData(): Promise<void> {
    try {
      await chrome.storage.local.clear();
      await chrome.storage.sync.clear();
    } catch (error) {
      console.error('Failed to clear all data:', error);
      throw error;
    }
  }
}