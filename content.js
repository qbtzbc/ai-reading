// AI Reading - 极简化内容脚本
// 原生JavaScript实现，无依赖，零构建

console.log('AI Reading content script loaded on:', window.location.href);

// 简单的小说阅读器类
class SimpleNovelReader {
  constructor() {
    this.synthesis = window.speechSynthesis;
    this.isReading = false;
    this.isPaused = false;
    this.novelContent = '';
    this.currentUtterance = null;
    this.currentPosition = 0;
    this.sentences = [];
    this.currentSentenceIndex = 0;
    
    this.init();
  }

  init() {
    // 延迟执行内容检测，等待页面完全加载
    setTimeout(() => this.detectContent(), 1000);
    
    // 监听来自background和popup的消息
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true;
    });

    // 监听页面变化
    this.observePageChanges();
  }

  // 检测小说内容
  detectContent() {
    console.log('Detecting novel content...');
    
    // 常见的小说内容选择器
    const selectors = [
      '.content', '#content', '.chapter-content', '.article-content',
      '.main-content', '.post-content', '.entry-content', '.text-content',
      '[class*="content"]', '[class*="chapter"]', '[class*="article"]',
      '.novel-content', '.book-content', '.reading-content',
      'main', 'article', '.main', '.article'
    ];
    
    let bestMatch = null;
    let maxLength = 0;
    
    for (const selector of selectors) {
      try {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
          const text = this.extractText(element);
          if (text.length > 300 && text.length > maxLength) {
            maxLength = text.length;
            bestMatch = {
              element: element,
              content: text,
              selector: selector
            };
          }
        }
      } catch (error) {
        console.warn(`Failed to check selector ${selector}:`, error);
      }
    }
    
    if (bestMatch) {
      this.novelContent = bestMatch.content;
      this.sentences = this.splitIntoSentences(this.novelContent);
      
      console.log(`Novel content detected: ${this.novelContent.length} characters, ${this.sentences.length} sentences`);
      
      // 通知background script
      this.notifyBackground('NOVEL_DETECTED', {
        content: this.novelContent.substring(0, 200) + '...',
        length: this.novelContent.length,
        sentences: this.sentences.length,
        url: location.href,
        title: document.title,
        selector: bestMatch.selector
      });
      
      return true;
    }
    
    console.log('No novel content detected');
    return false;
  }

  // 提取元素文本
  extractText(element) {
    // 创建元素副本以避免修改原始DOM
    const clone = element.cloneNode(true);
    
    // 移除脚本和样式标签
    const scripts = clone.querySelectorAll('script, style, noscript');
    scripts.forEach(el => el.remove());
    
    // 移除广告等无关元素
    const ads = clone.querySelectorAll('[class*="ad"], [id*="ad"], .advertisement, .ads');
    ads.forEach(el => el.remove());
    
    return clone.textContent || clone.innerText || '';
  }

  // 将文本分割为句子
  splitIntoSentences(text) {
    // 简单的中英文句子分割
    return text
      .split(/[。！？；\.\!\?\;]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  // 处理消息
  handleMessage(message, sender, sendResponse) {
    console.log('Content script received message:', message.type);
    
    switch (message.type) {
      case 'START_READING':
        this.startReading(message.data);
        sendResponse({ success: true });
        break;
        
      case 'STOP_READING':
        this.stopReading();
        sendResponse({ success: true });
        break;
        
      case 'PAUSE_READING':
        this.pauseReading();
        sendResponse({ success: true });
        break;
        
      case 'RESUME_READING':
        this.resumeReading();
        sendResponse({ success: true });
        break;
        
      case 'GET_STATUS':
        sendResponse({
          isReading: this.isReading,
          isPaused: this.isPaused,
          hasContent: this.novelContent.length > 0,
          progress: this.getProgress()
        });
        break;
        
      case 'DETECT_CONTENT':
        const detected = this.detectContent();
        sendResponse({ 
          detected, 
          contentLength: this.novelContent.length,
          sentences: this.sentences.length 
        });
        break;
        
      case 'UPDATE_SETTINGS':
        this.updateSettings(message.data);
        sendResponse({ success: true });
        break;
        
      default:
        sendResponse({ error: 'Unknown message type: ' + message.type });
    }
  }

  // 开始朗读
  async startReading(data = {}) {
    if (!this.novelContent) {
      const detected = this.detectContent();
      if (!detected) {
        throw new Error('No content to read');
      }
    }

    if (this.isReading) {
      console.log('Already reading, stopping first...');
      this.stopReading();
    }

    console.log('Starting to read...');

    // 获取设置
    const settings = await this.getSettings();
    
    // 设置朗读位置
    this.currentSentenceIndex = data.sentenceIndex || 0;
    
    this.isReading = true;
    this.isPaused = false;
    
    this.readNextSentence(settings);
    
    // 通知状态变化
    this.notifyBackground('SPEECH_STATUS', { 
      isReading: true, 
      paused: false,
      progress: this.getProgress()
    });
  }

  // 朗读下一句
  readNextSentence(settings) {
    if (!this.isReading || this.isPaused || this.currentSentenceIndex >= this.sentences.length) {
      if (this.currentSentenceIndex >= this.sentences.length) {
        console.log('Reading completed');
        this.stopReading();
      }
      return;
    }

    const sentence = this.sentences[this.currentSentenceIndex];
    console.log(`Reading sentence ${this.currentSentenceIndex + 1}/${this.sentences.length}: ${sentence.substring(0, 50)}...`);

    this.currentUtterance = new SpeechSynthesisUtterance(sentence);
    this.currentUtterance.rate = settings.rate || 1.0;
    this.currentUtterance.volume = settings.volume || 0.8;
    
    // 设置语音
    if (settings.voiceType) {
      const voices = this.synthesis.getVoices();
      const voice = voices.find(v => v.name === settings.voiceType);
      if (voice) {
        this.currentUtterance.voice = voice;
      }
    }

    this.currentUtterance.onend = () => {
      if (this.isReading && !this.isPaused) {
        this.currentSentenceIndex++;
        setTimeout(() => this.readNextSentence(settings), 100); // 短暂停顿
      }
    };

    this.currentUtterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      this.stopReading();
    };

    this.synthesis.speak(this.currentUtterance);
  }

  // 停止朗读
  stopReading() {
    console.log('Stopping reading...');
    
    this.synthesis.cancel();
    this.isReading = false;
    this.isPaused = false;
    this.currentUtterance = null;
    
    this.notifyBackground('SPEECH_STATUS', { 
      isReading: false, 
      paused: false,
      progress: this.getProgress()
    });
  }

  // 暂停朗读
  pauseReading() {
    if (!this.isReading) return;
    
    console.log('Pausing reading...');
    
    this.synthesis.pause();
    this.isPaused = true;
    
    this.notifyBackground('SPEECH_STATUS', { 
      isReading: false, 
      paused: true,
      progress: this.getProgress()
    });
  }

  // 恢复朗读
  resumeReading() {
    if (!this.isPaused) return;
    
    console.log('Resuming reading...');
    
    if (this.synthesis.paused) {
      this.synthesis.resume();
    } else {
      // 如果暂停太久，重新开始朗读当前句子
      this.startReading({ sentenceIndex: this.currentSentenceIndex });
      return;
    }
    
    this.isPaused = false;
    
    this.notifyBackground('SPEECH_STATUS', { 
      isReading: true, 
      paused: false,
      progress: this.getProgress()
    });
  }

  // 获取朗读进度
  getProgress() {
    if (this.sentences.length === 0) return 0;
    return Math.round((this.currentSentenceIndex / this.sentences.length) * 100);
  }

  // 更新设置
  updateSettings(newSettings) {
    console.log('Settings updated:', newSettings);
    // 如果正在朗读，应用新设置到当前utterance
    if (this.currentUtterance) {
      if (newSettings.rate !== undefined) {
        this.currentUtterance.rate = newSettings.rate;
      }
      if (newSettings.volume !== undefined) {
        this.currentUtterance.volume = newSettings.volume;
      }
    }
  }

  // 获取设置
  async getSettings() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (response) => {
        resolve(response || {
          rate: 1.0,
          volume: 0.8,
          voiceType: ''
        });
      });
    });
  }

  // 监听页面变化
  observePageChanges() {
    const observer = new MutationObserver((mutations) => {
      let hasSignificantChange = false;
      
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // 检查是否有重要内容变化
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const text = node.textContent || '';
              if (text.length > 100) {
                hasSignificantChange = true;
                break;
              }
            }
          }
        }
      }
      
      if (hasSignificantChange) {
        console.log('Page content changed, re-detecting...');
        setTimeout(() => this.detectContent(), 500);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // 通知background script
  notifyBackground(type, data) {
    chrome.runtime.sendMessage({ type, data }).catch(error => {
      console.warn('Failed to send message to background:', error);
    });
  }
}

// 启动小说阅读器
new SimpleNovelReader();