// AI Reading - 极简化弹出界面控制器
// 原生JavaScript实现，无依赖，零构建

console.log('AI Reading popup loaded');

class PopupController {
  constructor() {
    this.currentTab = null;
    this.isReading = false;
    this.isPaused = false;
    this.settings = {
      rate: 1.0,
      volume: 0.8,
      voiceType: ''
    };
    
    this.initElements();
    this.bindEvents();
    this.loadCurrentState();
  }

  // 初始化DOM元素
  initElements() {
    // 状态元素
    this.statusText = document.getElementById('status-text');
    this.indicator = document.getElementById('indicator');
    this.progressContainer = document.getElementById('progress-container');
    this.progressBar = document.getElementById('progress-bar');
    this.progressText = document.getElementById('progress-text');
    
    // 控制按钮
    this.playBtn = document.getElementById('play-btn');
    this.pauseBtn = document.getElementById('pause-btn');
    this.stopBtn = document.getElementById('stop-btn');
    
    // 检测信息
    this.detectionInfo = document.getElementById('detection-info');
    this.contentLength = document.getElementById('content-length');
    this.sentenceCount = document.getElementById('sentence-count');
    
    // 设置控件
    this.rateSlider = document.getElementById('rate');
    this.volumeSlider = document.getElementById('volume');
    this.voiceSelect = document.getElementById('voice-select');
    this.rateVal = document.getElementById('rate-val');
    this.volVal = document.getElementById('vol-val');
    
    // 操作按钮
    this.detectBtn = document.getElementById('detect-btn');
    this.optionsBtn = document.getElementById('options-btn');
    
    // 错误提示
    this.errorMessage = document.getElementById('error-message');
  }

  // 绑定事件
  bindEvents() {
    // 控制按钮事件
    this.playBtn.onclick = () => this.startReading();
    this.pauseBtn.onclick = () => this.pauseReading();
    this.stopBtn.onclick = () => this.stopReading();
    
    // 设置变化事件
    this.rateSlider.oninput = (e) => {
      const value = parseFloat(e.target.value);
      this.rateVal.textContent = value.toFixed(1) + 'x';
      this.updateSetting('rate', value);
    };
    
    this.volumeSlider.oninput = (e) => {
      const value = parseFloat(e.target.value);
      this.volVal.textContent = Math.round(value * 100) + '%';
      this.updateSetting('volume', value);
    };
    
    this.voiceSelect.onchange = (e) => {
      this.updateSetting('voiceType', e.target.value);
    };
    
    // 操作按钮事件
    this.detectBtn.onclick = () => this.detectContent();
    this.optionsBtn.onclick = () => this.openOptions();
  }

  // 加载当前状态
  async loadCurrentState() {
    try {
      // 获取当前活动标签页
      this.currentTab = await this.getCurrentTab();
      
      // 加载设置
      await this.loadSettings();
      
      // 加载语音列表
      this.loadVoices();
      
      // 获取内容脚本状态
      await this.getContentScriptStatus();
      
      // 检查是否有检测到的内容
      await this.checkDetectedContent();
      
    } catch (error) {
      console.error('Failed to load current state:', error);
      this.showError('加载状态失败: ' + error.message);
    }
  }

  // 获取当前标签页
  async getCurrentTab() {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        resolve(tabs[0]);
      });
    });
  }

  // 加载设置
  async loadSettings() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (response) => {
        if (response) {
          this.settings = { ...this.settings, ...response };
          this.updateSettingsUI();
        }
        resolve();
      });
    });
  }

  // 更新设置UI
  updateSettingsUI() {
    this.rateSlider.value = this.settings.rate || 1.0;
    this.rateVal.textContent = (this.settings.rate || 1.0).toFixed(1) + 'x';
    
    this.volumeSlider.value = this.settings.volume || 0.8;
    this.volVal.textContent = Math.round((this.settings.volume || 0.8) * 100) + '%';
    
    this.voiceSelect.value = this.settings.voiceType || '';
  }

  // 加载可用语音
  loadVoices() {
    const voices = speechSynthesis.getVoices();
    this.voiceSelect.innerHTML = '<option value="">系统默认</option>';
    
    voices.forEach(voice => {
      const option = document.createElement('option');
      option.value = voice.name;
      option.textContent = `${voice.name} (${voice.lang})`;
      this.voiceSelect.appendChild(option);
    });
    
    // 如果有设置的语音，选中它
    if (this.settings.voiceType) {
      this.voiceSelect.value = this.settings.voiceType;
    }
  }

  // 获取内容脚本状态
  async getContentScriptStatus() {
    return new Promise((resolve) => {
      if (!this.currentTab?.id) {
        this.updateStatusUI('无活动标签页', 'error');
        resolve();
        return;
      }
      
      // 检查URL是否支持内容脚本
      if (this.isRestrictedUrl(this.currentTab.url)) {
        this.updateStatusUI('此页面不支持扩展', 'error');
        resolve();
        return;
      }
      
      // 设置超时以避免无限等待
      const timeout = setTimeout(() => {
        console.warn('Content script response timeout');
        this.handleContentScriptUnavailable();
        resolve();
      }, 2000);
      
      chrome.tabs.sendMessage(this.currentTab.id, { type: 'GET_STATUS' }, (response) => {
        clearTimeout(timeout);
        
        if (chrome.runtime.lastError) {
          console.warn('Content script not available:', chrome.runtime.lastError.message);
          this.handleContentScriptUnavailable();
        } else if (response) {
          this.updateStatusFromResponse(response);
        } else {
          this.handleContentScriptUnavailable();
        }
        resolve();
      });
    });
  }
  
  // 检查是否为受限URL
  isRestrictedUrl(url) {
    if (!url) return true;
    
    const restrictedPatterns = [
      /^chrome:/,
      /^chrome-extension:/,
      /^edge:/,
      /^about:/,
      /^moz-extension:/,
      /^devtools:/,
      /^file:/
    ];
    
    return restrictedPatterns.some(pattern => pattern.test(url));
  }
  
  // 处理内容脚本不可用的情况
  handleContentScriptUnavailable() {
    this.updateStatusUI('等待页面加载...', 'loading');
    this.showContentScriptTips();
  }
  
  // 显示内容脚本提示
  showContentScriptTips() {
    const existingTips = document.getElementById('content-script-tips');
    if (existingTips) return;
    
    const tips = document.createElement('div');
    tips.id = 'content-script-tips';
    tips.className = 'tips-container';
    tips.innerHTML = `
      <div class="tips-content">
        <h4>📖 使用提示</h4>
        <ul>
          <li>请刷新页面后重试</li>
          <li>确保页面已完全加载</li>
          <li>某些特殊页面（如chrome://）不支持扩展</li>
          <li>点击"重新检测内容"按钮</li>
        </ul>
        <button onclick="this.parentElement.parentElement.remove()" class="close-tips">知道了</button>
      </div>
    `;
    
    // 在错误消息后插入提示
    const errorMessage = document.getElementById('error-message');
    errorMessage.parentNode.insertBefore(tips, errorMessage.nextSibling);
  }

  // 检查检测到的内容
  async checkDetectedContent() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'GET_NOVEL_DATA' }, (response) => {
        if (response && response.length > 0) {
          this.showDetectionInfo(response);
        }
        resolve();
      });
    });
  }

  // 更新状态UI
  updateStatusFromResponse(response) {
    if (response.isReading) {
      this.updateStatusUI('正在朗读...', 'active');
      this.updateControlsUI(true, false);
      if (response.progress !== undefined) {
        this.updateProgressUI(response.progress);
      }
    } else if (response.isPaused) {
      this.updateStatusUI('已暂停', 'paused');
      this.updateControlsUI(false, true);
    } else {
      this.updateStatusUI(response.hasContent ? '准备就绪' : '未检测到内容', 'idle');
      this.updateControlsUI(false, false);
    }
  }

  // 更新状态显示
  updateStatusUI(text, state = 'idle') {
    this.statusText.textContent = text;
    this.indicator.className = 'indicator ' + (state !== 'idle' ? state : '');
  }

  // 更新控制按钮状态
  updateControlsUI(isReading, isPaused) {
    this.isReading = isReading;
    this.isPaused = isPaused;
    
    this.playBtn.disabled = isReading;
    this.pauseBtn.disabled = !isReading;
    this.stopBtn.disabled = !isReading && !isPaused;
    
    // 更新按钮文本
    if (isPaused) {
      this.playBtn.querySelector('.text').textContent = '继续朗读';
    } else {
      this.playBtn.querySelector('.text').textContent = '开始朗读';
    }
  }

  // 更新进度显示
  updateProgressUI(progress) {
    if (progress > 0) {
      this.progressContainer.style.display = 'block';
      this.progressBar.style.width = progress + '%';
      this.progressText.textContent = progress + '%';
    } else {
      this.progressContainer.style.display = 'none';
    }
  }

  // 显示检测信息
  showDetectionInfo(data) {
    this.detectionInfo.style.display = 'block';
    this.contentLength.textContent = data.length + ' 字符';
    this.sentenceCount.textContent = data.sentences + ' 句';
  }

  // 开始朗读
  async startReading() {
    try {
      this.hideError();
      
      if (!this.currentTab?.id) {
        throw new Error('没有找到当前标签页');
      }
      
      if (this.isRestrictedUrl(this.currentTab.url)) {
        throw new Error('此页面不支持扩展功能');
      }
      
      const message = this.isPaused ? 
        { type: 'RESUME_READING' } : 
        { type: 'START_READING', data: {} };
      
      // 发送消息并处理响应
      this.sendMessageToContentScript(message, (response) => {
        if (response?.error) {
          this.showError(response.error);
        } else {
          this.updateStatusUI('正在朗读...', 'active');
          this.updateControlsUI(true, false);
        }
      });
      
    } catch (error) {
      console.error('Failed to start reading:', error);
      this.showError('开始朗读失败: ' + error.message);
    }
  }
  
  // 发送消息到内容脚本（带重试机制）
  sendMessageToContentScript(message, callback, retryCount = 0) {
    const maxRetries = 2;
    
    chrome.tabs.sendMessage(this.currentTab.id, message, (response) => {
      if (chrome.runtime.lastError) {
        console.warn(`Message send attempt ${retryCount + 1} failed:`, chrome.runtime.lastError.message);
        
        if (retryCount < maxRetries) {
          // 短暂延迟后重试
          setTimeout(() => {
            this.sendMessageToContentScript(message, callback, retryCount + 1);
          }, 500 * (retryCount + 1));
        } else {
          // 重试失败，建议用户刷新页面
          this.showError('无法与页面通信，请刷新页面后重试');
          this.showContentScriptTips();
        }
      } else {
        callback(response);
      }
    });
  }

  // 暂停朗读
  async pauseReading() {
    try {
      if (!this.currentTab?.id) return;
      
      this.sendMessageToContentScript({ type: 'PAUSE_READING' }, (response) => {
        if (!response?.error) {
          this.updateStatusUI('已暂停', 'paused');
          this.updateControlsUI(false, true);
        } else {
          this.showError('暂停失败: ' + response.error);
        }
      });
      
    } catch (error) {
      console.error('Failed to pause reading:', error);
      this.showError('暂停失败: ' + error.message);
    }
  }

  // 停止朗读
  async stopReading() {
    try {
      if (!this.currentTab?.id) return;
      
      this.sendMessageToContentScript({ type: 'STOP_READING' }, (response) => {
        if (!response?.error) {
          this.updateStatusUI('已停止', 'idle');
          this.updateControlsUI(false, false);
          this.updateProgressUI(0);
        } else {
          this.showError('停止失败: ' + response.error);
        }
      });
      
    } catch (error) {
      console.error('Failed to stop reading:', error);
      this.showError('停止失败: ' + error.message);
    }
  }

  // 检测内容
  async detectContent() {
    try {
      this.hideError();
      
      if (!this.currentTab?.id) {
        throw new Error('没有找到当前标签页');
      }
      
      if (this.isRestrictedUrl(this.currentTab.url)) {
        throw new Error('此页面不支持扩展功能');
      }
      
      this.detectBtn.textContent = '检测中...';
      this.detectBtn.disabled = true;
      
      this.sendMessageToContentScript({ type: 'DETECT_CONTENT' }, (response) => {
        this.detectBtn.textContent = '重新检测内容';
        this.detectBtn.disabled = false;
        
        if (response?.detected) {
          this.showDetectionInfo({
            length: response.contentLength,
            sentences: response.sentences
          });
          this.updateStatusUI('检测到小说内容', 'idle');
          // 移除提示
          const tips = document.getElementById('content-script-tips');
          if (tips) tips.remove();
        } else if (response?.error) {
          this.showError('检测失败: ' + response.error);
        } else {
          this.showError('未检测到小说内容，请确保页面包含文章内容');
        }
      });
      
    } catch (error) {
      console.error('Failed to detect content:', error);
      this.showError('检测内容失败: ' + error.message);
      this.detectBtn.textContent = '重新检测内容';
      this.detectBtn.disabled = false;
    }
  }

  // 更新设置
  updateSetting(key, value) {
    this.settings[key] = value;
    
    // 保存设置
    chrome.runtime.sendMessage({ 
      type: 'SAVE_SETTINGS', 
      data: this.settings 
    });
    
    // 如果正在朗读，立即应用设置
    if (this.currentTab?.id && this.isReading && !this.isRestrictedUrl(this.currentTab.url)) {
      this.sendMessageToContentScript({
        type: 'UPDATE_SETTINGS',
        data: { [key]: value }
      }, (response) => {
        if (response?.error) {
          console.warn('Failed to update settings in content script:', response.error);
        }
      });
    }
  }

  // 打开选项页面
  openOptions() {
    chrome.runtime.openOptionsPage();
  }

  // 显示错误信息
  showError(message) {
    this.errorMessage.textContent = message;
    this.errorMessage.style.display = 'block';
    
    // 5秒后自动隐藏
    setTimeout(() => this.hideError(), 5000);
  }

  // 隐藏错误信息
  hideError() {
    this.errorMessage.style.display = 'none';
  }
}

// 等待DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});

// 语音加载完成后更新语音列表
speechSynthesis.onvoiceschanged = () => {
  if (window.popupController) {
    window.popupController.loadVoices();
  }
};