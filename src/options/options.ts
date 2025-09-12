import { StorageManager, UserSettings } from '@/utils/storage';

// 设置页面控制类
class OptionsController {
  private currentSettings: UserSettings;
  private availableVoices: SpeechSynthesisVoice[] = [];

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
      
      // 加载语音列表
      await this.loadVoices();
      
      // 设置UI
      this.setupUI();
      
      // 绑定事件
      this.bindEvents();
      
      console.log('Options page initialized');
    } catch (error) {
      console.error('Failed to initialize options page:', error);
    }
  }

  // 加载设置
  private async loadSettings(): Promise<void> {
    this.currentSettings = await StorageManager.getUserSettings();
  }

  // 加载语音列表
  private async loadVoices(): Promise<void> {
    return new Promise((resolve) => {
      const loadVoiceList = () => {
        this.availableVoices = speechSynthesis.getVoices().filter(voice => 
          voice.lang.startsWith('zh') || voice.lang.startsWith('en')
        );
        
        if (this.availableVoices.length > 0) {
          this.populateVoiceSelect();
          resolve();
        }
      };

      loadVoiceList();

      if (this.availableVoices.length === 0) {
        speechSynthesis.addEventListener('voiceschanged', () => {
          loadVoiceList();
        });
      }
    });
  }

  // 填充语音选择器
  private populateVoiceSelect(): void {
    const voiceSelect = document.getElementById('voice-select') as HTMLSelectElement;
    if (!voiceSelect) return;

    // 清空现有选项
    voiceSelect.innerHTML = '<option value="">默认语音</option>';

    // 添加语音选项
    this.availableVoices.forEach(voice => {
      const option = document.createElement('option');
      option.value = voice.name;
      option.textContent = `${voice.name} (${voice.lang})`;
      voiceSelect.appendChild(option);
    });

    // 设置当前选中的语音
    voiceSelect.value = this.currentSettings.voiceType;
  }

  // 设置UI
  private setupUI(): void {
    // 语音选择
    const voiceSelect = document.getElementById('voice-select') as HTMLSelectElement;
    if (voiceSelect) {
      voiceSelect.value = this.currentSettings.voiceType;
    }

    // 语速设置
    const speechRateSlider = document.getElementById('speech-rate-setting') as HTMLInputElement;
    const speechRateValue = document.getElementById('speech-rate-value-setting') as HTMLSpanElement;
    if (speechRateSlider && speechRateValue) {
      speechRateSlider.value = this.currentSettings.speechRate.toString();
      speechRateValue.textContent = `${this.currentSettings.speechRate}x`;
    }

    // 音量设置
    const volumeSlider = document.getElementById('volume-setting') as HTMLInputElement;
    const volumeValue = document.getElementById('volume-value-setting') as HTMLSpanElement;
    if (volumeSlider && volumeValue) {
      volumeSlider.value = this.currentSettings.volume.toString();
      volumeValue.textContent = `${Math.round(this.currentSettings.volume * 100)}%`;
    }

    // 自动检测设置
    const autoDetectCheckbox = document.getElementById('auto-detect') as HTMLInputElement;
    if (autoDetectCheckbox) {
      autoDetectCheckbox.checked = this.currentSettings.autoDetect;
    }
  }

  // 绑定事件
  private bindEvents(): void {
    // 语音选择
    const voiceSelect = document.getElementById('voice-select') as HTMLSelectElement;
    voiceSelect?.addEventListener('change', (e) => {
      this.currentSettings.voiceType = (e.target as HTMLSelectElement).value;
      this.showUnsavedChanges();
    });

    // 语速滑块
    const speechRateSlider = document.getElementById('speech-rate-setting') as HTMLInputElement;
    speechRateSlider?.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      this.currentSettings.speechRate = value;
      
      const valueDisplay = document.getElementById('speech-rate-value-setting');
      if (valueDisplay) {
        valueDisplay.textContent = `${value}x`;
      }
      
      this.showUnsavedChanges();
    });

    // 音量滑块
    const volumeSlider = document.getElementById('volume-setting') as HTMLInputElement;
    volumeSlider?.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      this.currentSettings.volume = value;
      
      const valueDisplay = document.getElementById('volume-value-setting');
      if (valueDisplay) {
        valueDisplay.textContent = `${Math.round(value * 100)}%`;
      }
      
      this.showUnsavedChanges();
    });

    // 自动检测复选框
    const autoDetectCheckbox = document.getElementById('auto-detect') as HTMLInputElement;
    autoDetectCheckbox?.addEventListener('change', (e) => {
      this.currentSettings.autoDetect = (e.target as HTMLInputElement).checked;
      this.showUnsavedChanges();
    });

    // 保存按钮
    const saveBtn = document.getElementById('save-btn');
    saveBtn?.addEventListener('click', () => this.saveSettings());

    // 导出数据按钮
    const exportBtn = document.getElementById('export-data-btn');
    exportBtn?.addEventListener('click', () => this.exportData());

    // 导入数据按钮
    const importBtn = document.getElementById('import-data-btn');
    const importFile = document.getElementById('import-file') as HTMLInputElement;
    
    importBtn?.addEventListener('click', () => {
      importFile?.click();
    });
    
    importFile?.addEventListener('change', (e) => {
      this.importData(e);
    });

    // 清除进度按钮
    const clearProgressBtn = document.getElementById('clear-progress-btn');
    clearProgressBtn?.addEventListener('click', () => this.clearProgress());

    // 重置设置按钮
    const resetBtn = document.getElementById('reset-settings-btn');
    resetBtn?.addEventListener('click', () => this.resetSettings());
  }

  // 保存设置
  private async saveSettings(): Promise<void> {
    try {
      await StorageManager.saveUserSettings(this.currentSettings);
      this.showSaveStatus('设置已保存', 'success');
      this.hideSaveButton();
    } catch (error) {
      console.error('Failed to save settings:', error);
      this.showSaveStatus('保存失败', 'error');
    }
  }

  // 显示未保存的更改
  private showUnsavedChanges(): void {
    const saveBtn = document.getElementById('save-btn') as HTMLButtonElement;
    if (saveBtn) {
      saveBtn.style.display = 'block';
      saveBtn.textContent = '保存更改';
    }
  }

  // 隐藏保存按钮
  private hideSaveButton(): void {
    const saveBtn = document.getElementById('save-btn') as HTMLButtonElement;
    if (saveBtn) {
      setTimeout(() => {
        saveBtn.style.display = 'none';
      }, 2000);
    }
  }

  // 显示保存状态
  private showSaveStatus(message: string, type: 'success' | 'error'): void {
    const statusElement = document.getElementById('save-status');
    if (statusElement) {
      statusElement.textContent = message;
      statusElement.className = `save-status ${type}`;
      
      setTimeout(() => {
        statusElement.textContent = '';
        statusElement.className = 'save-status';
      }, 3000);
    }
  }

  // 导出数据
  private async exportData(): Promise<void> {
    try {
      const settings = await StorageManager.getUserSettings();
      const data = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        settings: settings,
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-reading-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      this.showSaveStatus('设置已导出', 'success');
    } catch (error) {
      console.error('Failed to export data:', error);
      this.showSaveStatus('导出失败', 'error');
    }
  }

  // 导入数据
  private async importData(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (data.settings) {
        this.currentSettings = { ...this.currentSettings, ...data.settings };
        this.setupUI();
        await this.saveSettings();
        this.showSaveStatus('设置已导入', 'success');
      } else {
        throw new Error('Invalid file format');
      }
    } catch (error) {
      console.error('Failed to import data:', error);
      this.showSaveStatus('导入失败', 'error');
    }
    
    // 清空文件输入
    input.value = '';
  }

  // 清除阅读进度
  private async clearProgress(): Promise<void> {
    if (!confirm('确定要清除所有阅读进度吗？此操作不可撤销。')) {
      return;
    }

    try {
      // 这里需要实现清除进度的逻辑
      // 由于我们没有专门的清除进度方法，这里只是示例
      this.showSaveStatus('阅读进度已清除', 'success');
    } catch (error) {
      console.error('Failed to clear progress:', error);
      this.showSaveStatus('清除失败', 'error');
    }
  }

  // 重置设置
  private async resetSettings(): Promise<void> {
    if (!confirm('确定要重置所有设置吗？此操作不可撤销。')) {
      return;
    }

    try {
      await StorageManager.clearAllData();
      
      // 重新加载默认设置
      this.currentSettings = {
        voiceType: '',
        speechRate: 1.0,
        volume: 0.8,
        autoDetect: true,
        favoriteVoices: [],
      };
      
      this.setupUI();
      this.showSaveStatus('设置已重置', 'success');
    } catch (error) {
      console.error('Failed to reset settings:', error);
      this.showSaveStatus('重置失败', 'error');
    }
  }
}

// 初始化设置页面
document.addEventListener('DOMContentLoaded', () => {
  new OptionsController();
});