// AI Reading - 极简化选项页面控制器
// 原生JavaScript实现，无依赖，零构建

console.log('AI Reading options page loaded');

class OptionsController {
  constructor() {
    this.settings = {
      autoDetect: true,
      rate: 1.0,
      volume: 0.8,
      voiceType: '',
      sensitivity: 'high',
      minContentLength: 300
    };
    
    this.initElements();
    this.bindEvents();
    this.loadSettings();
    this.loadVoices();
  }

  // 初始化DOM元素
  initElements() {
    // 基本设置
    this.autoDetectCheckbox = document.getElementById('auto-detect');
    
    // 语音设置
    this.defaultRateSlider = document.getElementById('default-rate');
    this.defaultVolumeSlider = document.getElementById('default-volume');
    this.defaultVoiceSelect = document.getElementById('default-voice');
    this.rateValue = document.getElementById('rate-value');
    this.volumeValue = document.getElementById('volume-value');
    
    // 检测设置
    this.sensitivityRadios = document.querySelectorAll('input[name="sensitivity"]');
    this.minContentLengthInput = document.getElementById('min-content-length');
    
    // 操作按钮
    this.exportBtn = document.getElementById('export-settings');
    this.importBtn = document.getElementById('import-settings');
    this.resetBtn = document.getElementById('reset-settings');
    this.importFile = document.getElementById('import-file');
    
    // 提示框
    this.toast = document.getElementById('toast');
  }

  // 绑定事件
  bindEvents() {
    // 基本设置事件
    this.autoDetectCheckbox.onchange = () => this.saveSettings();
    
    // 语音设置事件
    this.defaultRateSlider.oninput = (e) => {
      const value = parseFloat(e.target.value);
      this.rateValue.textContent = value.toFixed(1) + 'x';
      this.settings.rate = value;
      this.saveSettings();
    };
    
    this.defaultVolumeSlider.oninput = (e) => {
      const value = parseFloat(e.target.value);
      this.volumeValue.textContent = Math.round(value * 100) + '%';
      this.settings.volume = value;
      this.saveSettings();
    };
    
    this.defaultVoiceSelect.onchange = () => this.saveSettings();
    
    // 检测设置事件
    this.sensitivityRadios.forEach(radio => {
      radio.onchange = () => this.saveSettings();
    });
    
    this.minContentLengthInput.onchange = () => this.saveSettings();
    
    // 操作按钮事件
    this.exportBtn.onclick = () => this.exportSettings();
    this.importBtn.onclick = () => this.importFile.click();
    this.resetBtn.onclick = () => this.resetSettings();
    this.importFile.onchange = (e) => this.importSettings(e);
  }

  // 加载设置
  async loadSettings() {
    try {
      const result = await this.getStorageData(['settings']);
      if (result.settings) {
        this.settings = { ...this.settings, ...result.settings };
      }
      this.updateUI();
    } catch (error) {
      console.error('Failed to load settings:', error);
      this.showToast('加载设置失败', 'error');
    }
  }

  // 更新UI
  updateUI() {
    // 基本设置
    this.autoDetectCheckbox.checked = this.settings.autoDetect;
    
    // 语音设置
    this.defaultRateSlider.value = this.settings.rate;
    this.rateValue.textContent = this.settings.rate.toFixed(1) + 'x';
    
    this.defaultVolumeSlider.value = this.settings.volume;
    this.volumeValue.textContent = Math.round(this.settings.volume * 100) + '%';
    
    this.defaultVoiceSelect.value = this.settings.voiceType || '';
    
    // 检测设置
    const sensitivityRadio = document.querySelector(`input[name="sensitivity"][value="${this.settings.sensitivity}"]`);
    if (sensitivityRadio) {
      sensitivityRadio.checked = true;
    }
    
    this.minContentLengthInput.value = this.settings.minContentLength;
  }

  // 保存设置
  async saveSettings() {
    try {
      // 收集当前设置
      this.settings.autoDetect = this.autoDetectCheckbox.checked;
      this.settings.voiceType = this.defaultVoiceSelect.value;
      
      const checkedSensitivity = document.querySelector('input[name="sensitivity"]:checked');
      if (checkedSensitivity) {
        this.settings.sensitivity = checkedSensitivity.value;
      }
      
      this.settings.minContentLength = parseInt(this.minContentLengthInput.value) || 300;
      
      // 保存到存储
      await this.setStorageData({ settings: this.settings });
      
      console.log('Settings saved:', this.settings);
      this.showToast('设置已保存');
      
    } catch (error) {
      console.error('Failed to save settings:', error);
      this.showToast('保存设置失败', 'error');
    }
  }

  // 加载可用语音
  loadVoices() {
    const voices = speechSynthesis.getVoices();
    
    // 清空现有选项
    this.defaultVoiceSelect.innerHTML = '<option value="">系统默认</option>';
    
    // 添加语音选项
    voices.forEach(voice => {
      const option = document.createElement('option');
      option.value = voice.name;
      option.textContent = `${voice.name} (${voice.lang})`;
      this.defaultVoiceSelect.appendChild(option);
    });
    
    // 恢复选中状态
    if (this.settings.voiceType) {
      this.defaultVoiceSelect.value = this.settings.voiceType;
    }
  }

  // 导出设置
  exportSettings() {
    try {
      const dataStr = JSON.stringify(this.settings, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = `ai-reading-settings-${new Date().getTime()}.json`;
      link.click();
      
      this.showToast('设置已导出');
      
    } catch (error) {
      console.error('Failed to export settings:', error);
      this.showToast('导出设置失败', 'error');
    }
  }

  // 导入设置
  async importSettings(event) {
    try {
      const file = event.target.files[0];
      if (!file) return;
      
      const text = await this.readFileAsText(file);
      const importedSettings = JSON.parse(text);
      
      // 验证设置格式
      if (typeof importedSettings !== 'object') {
        throw new Error('无效的设置文件格式');
      }
      
      // 合并设置
      this.settings = { ...this.settings, ...importedSettings };
      
      // 保存并更新UI
      await this.setStorageData({ settings: this.settings });
      this.updateUI();
      
      this.showToast('设置已导入');
      
    } catch (error) {
      console.error('Failed to import settings:', error);
      this.showToast('导入设置失败: ' + error.message, 'error');
    }
    
    // 清空文件输入
    event.target.value = '';
  }

  // 重置设置
  async resetSettings() {
    if (!confirm('确定要重置所有设置吗？此操作不可撤销。')) {
      return;
    }
    
    try {
      // 重置为默认设置
      this.settings = {
        autoDetect: true,
        rate: 1.0,
        volume: 0.8,
        voiceType: '',
        sensitivity: 'high',
        minContentLength: 300
      };
      
      // 清空所有存储数据
      await this.clearStorage();
      
      // 保存默认设置
      await this.setStorageData({ settings: this.settings });
      
      // 更新UI
      this.updateUI();
      
      this.showToast('设置已重置');
      
    } catch (error) {
      console.error('Failed to reset settings:', error);
      this.showToast('重置设置失败', 'error');
    }
  }

  // 显示提示信息
  showToast(message, type = 'success') {
    this.toast.textContent = message;
    this.toast.className = 'toast' + (type !== 'success' ? ' ' + type : '');
    this.toast.style.display = 'block';
    
    // 3秒后自动隐藏
    setTimeout(() => {
      this.toast.style.display = 'none';
    }, 3000);
  }

  // 存储操作辅助方法
  getStorageData(keys) {
    return new Promise((resolve) => {
      chrome.storage.local.get(keys, resolve);
    });
  }

  setStorageData(data) {
    return new Promise((resolve) => {
      chrome.storage.local.set(data, resolve);
    });
  }

  clearStorage() {
    return new Promise((resolve) => {
      chrome.storage.local.clear(resolve);
    });
  }

  // 文件读取辅助方法
  readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('文件读取失败'));
      reader.readAsText(file);
    });
  }
}

// 等待DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  new OptionsController();
});

// 语音加载完成后更新语音列表
speechSynthesis.onvoiceschanged = () => {
  if (window.optionsController) {
    window.optionsController.loadVoices();
  }
};