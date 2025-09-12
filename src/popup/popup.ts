import { StorageManager, UserSettings } from '@/utils/storage';
import { createApp } from 'vue'
import PopupApp from './PopupApp.vue'
import '@/styles/global.scss'

// 创建 Vue 应用实例
const app = createApp(PopupApp)

// 挂载应用
app.mount('#app')

// 开发环境下的热重载支持
if (import.meta.hot) {
  import.meta.hot.accept()
}

// Popup 界面控制类
class PopupController {
  private currentSettings: UserSettings;
  private isReading: boolean = false;
  private progress: { current: number; total: number; percentage: number } = { current: 0, total: 0, percentage: 0 };

  constructor() {
    this.currentSettings = {
      voiceType: '',
      speechRate: 1.0,
      volume: 0.8,
      autoDetect: true,
      favoriteVoices: [],
    };
    this.initialize();
  }

  // 初始化
  private async initialize(): Promise<void> {
    try {
      // 加载设置
      await this.loadSettings();
      
      // 设置UI
      this.setupUI();
      
      // 绑定事件
      this.bindEvents();
      
      // 更新状态
      await this.updateStatus();
      
      console.log('Popup initialized');
    } catch (error) {
      console.error('Failed to initialize popup:', error);
    }
  }

  // 加载设置
  private async loadSettings(): Promise<void> {
    this.currentSettings = await StorageManager.getUserSettings();
  }

  // 设置UI
  private setupUI(): void {
    // 设置语速滑块
    const speechRateSlider = document.getElementById('speech-rate') as HTMLInputElement;
    const speechRateValue = document.getElementById('speech-rate-value') as HTMLSpanElement;
    
    if (speechRateSlider && speechRateValue) {
      speechRateSlider.value = this.currentSettings.speechRate.toString();
      speechRateValue.textContent = `${this.currentSettings.speechRate}x`;
    }

    // 设置音量滑块
    const volumeSlider = document.getElementById('volume') as HTMLInputElement;
    const volumeValue = document.getElementById('volume-value') as HTMLSpanElement;
    
    if (volumeSlider && volumeValue) {
      volumeSlider.value = this.currentSettings.volume.toString();
      volumeValue.textContent = `${Math.round(this.currentSettings.volume * 100)}%`;
    }
  }

  // 绑定事件
  private bindEvents(): void {
    // 播放按钮
    const playBtn = document.getElementById('play-btn');
    playBtn?.addEventListener('click', () => this.handlePlay());

    // 暂停按钮
    const pauseBtn = document.getElementById('pause-btn');
    pauseBtn?.addEventListener('click', () => this.handlePause());

    // 停止按钮
    const stopBtn = document.getElementById('stop-btn');
    stopBtn?.addEventListener('click', () => this.handleStop());

    // 检测按钮
    const detectBtn = document.getElementById('detect-btn');
    detectBtn?.addEventListener('click', () => this.handleDetect());

    // 设置按钮
    const settingsBtn = document.getElementById('settings-btn');
    settingsBtn?.addEventListener('click', () => this.openSettings());

    // 语速滑块
    const speechRateSlider = document.getElementById('speech-rate') as HTMLInputElement;
    speechRateSlider?.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      this.updateSpeechRate(value);
    });

    // 音量滑块
    const volumeSlider = document.getElementById('volume') as HTMLInputElement;
    volumeSlider?.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      this.updateVolume(value);
    });
  }

  // 更新状态
  private async updateStatus(): Promise<void> {
    try {
      // 获取当前标签页
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentTab = tabs[0];

      if (!currentTab.id) return;

      // 向 content script 请求状态
      const response = await chrome.tabs.sendMessage(currentTab.id, {
        type: 'GET_READING_STATE',
      });

      if (response) {
        this.updateReadingState(response.state, response.progress);
      }

      // 检测内容
      const detectionResponse = await chrome.tabs.sendMessage(currentTab.id, {
        type: 'DETECT_CONTENT',
      });

      if (detectionResponse?.result?.isNovel) {
        this.updateDetectionStatus(true, detectionResponse.result);
      } else {
        this.updateDetectionStatus(false);
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      this.updateDetectionStatus(false);
    }
  }

  // 更新检测状态
  private updateDetectionStatus(detected: boolean, result?: any): void {
    const statusText = document.getElementById('status-text');
    const statusIndicator = document.getElementById('status-indicator');
    const playBtn = document.getElementById('play-btn') as HTMLButtonElement;

    if (!statusText || !statusIndicator || !playBtn) return;

    if (detected) {
      statusText.textContent = result?.title || '检测到小说内容';
      statusIndicator.className = 'status-indicator active';
      playBtn.disabled = false;
    } else {
      statusText.textContent = '未检测到小说内容';
      statusIndicator.className = 'status-indicator';
      playBtn.disabled = true;
    }
  }

  // 更新朗读状态
  private updateReadingState(state: string, progress?: any): void {
    this.isReading = state === 'playing';
    
    if (progress) {
      this.progress = progress;
      this.updateProgressDisplay();
    }

    this.updateButtonStates();
  }

  // 更新按钮状态
  private updateButtonStates(): void {
    const playBtn = document.getElementById('play-btn') as HTMLButtonElement;
    const pauseBtn = document.getElementById('pause-btn') as HTMLButtonElement;
    const stopBtn = document.getElementById('stop-btn') as HTMLButtonElement;

    if (!playBtn || !pauseBtn || !stopBtn) return;

    if (this.isReading) {
      playBtn.style.display = 'none';
      pauseBtn.style.display = 'flex';
      pauseBtn.disabled = false;
      stopBtn.disabled = false;
    } else {
      playBtn.style.display = 'flex';
      pauseBtn.style.display = 'none';
      pauseBtn.disabled = true;
      if (this.progress.current === 0) {
        stopBtn.disabled = true;
      }
    }
  }

  // 更新进度显示
  private updateProgressDisplay(): void {
    const currentProgress = document.getElementById('current-progress');
    const totalProgress = document.getElementById('total-progress');
    const progressPercentage = document.getElementById('progress-percentage');
    const progressFill = document.getElementById('progress-fill');

    if (currentProgress) currentProgress.textContent = this.progress.current.toString();
    if (totalProgress) totalProgress.textContent = this.progress.total.toString();
    if (progressPercentage) progressPercentage.textContent = `${Math.round(this.progress.percentage)}%`;
    if (progressFill) progressFill.style.width = `${this.progress.percentage}%`;
  }

  // 处理播放
  private async handlePlay(): Promise<void> {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentTab = tabs[0];

      if (!currentTab.id) return;

      await chrome.tabs.sendMessage(currentTab.id, {
        type: 'START_READING',
        data: { position: this.progress.current },
      });

      this.isReading = true;
      this.updateButtonStates();
    } catch (error) {
      console.error('Failed to start reading:', error);
    }
  }

  // 处理暂停
  private async handlePause(): Promise<void> {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentTab = tabs[0];

      if (!currentTab.id) return;

      await chrome.tabs.sendMessage(currentTab.id, {
        type: 'PAUSE_READING',
      });

      this.isReading = false;
      this.updateButtonStates();
    } catch (error) {
      console.error('Failed to pause reading:', error);
    }
  }

  // 处理停止
  private async handleStop(): Promise<void> {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentTab = tabs[0];

      if (!currentTab.id) return;

      await chrome.tabs.sendMessage(currentTab.id, {
        type: 'STOP_READING',
      });

      this.isReading = false;
      this.progress = { current: 0, total: 0, percentage: 0 };
      this.updateButtonStates();
      this.updateProgressDisplay();
    } catch (error) {
      console.error('Failed to stop reading:', error);
    }
  }

  // 处理重新检测
  private async handleDetect(): Promise<void> {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentTab = tabs[0];

      if (!currentTab.id) return;

      const response = await chrome.tabs.sendMessage(currentTab.id, {
        type: 'DETECT_CONTENT',
      });

      if (response?.result?.isNovel) {
        this.updateDetectionStatus(true, response.result);
      } else {
        this.updateDetectionStatus(false);
      }
    } catch (error) {
      console.error('Failed to detect content:', error);
    }
  }

  // 更新语速
  private async updateSpeechRate(value: number): Promise<void> {
    this.currentSettings.speechRate = value;
    
    const speechRateValue = document.getElementById('speech-rate-value');
    if (speechRateValue) {
      speechRateValue.textContent = `${value}x`;
    }

    // 保存设置
    await StorageManager.saveUserSettings({ speechRate: value });

    // 更新朗读器设置
    await this.updateReaderSettings();
  }

  // 更新音量
  private async updateVolume(value: number): Promise<void> {
    this.currentSettings.volume = value;
    
    const volumeValue = document.getElementById('volume-value');
    if (volumeValue) {
      volumeValue.textContent = `${Math.round(value * 100)}%`;
    }

    // 保存设置
    await StorageManager.saveUserSettings({ volume: value });

    // 更新朗读器设置
    await this.updateReaderSettings();
  }

  // 更新朗读器设置
  private async updateReaderSettings(): Promise<void> {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentTab = tabs[0];

      if (!currentTab.id) return;

      await chrome.tabs.sendMessage(currentTab.id, {
        type: 'UPDATE_SETTINGS',
        data: this.currentSettings,
      });
    } catch (error) {
      console.error('Failed to update reader settings:', error);
    }
  }

  // 打开设置页面
  private openSettings(): void {
    chrome.runtime.openOptionsPage();
  }
}

// 初始化 Popup
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});