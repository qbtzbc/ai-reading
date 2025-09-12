import { NovelDetector, NovelDetectionResult } from './novel-detector';
import { SpeechReader, ReadingState, ReadingEvent } from './reader';
import { StorageManager, UserSettings } from '@/utils/storage';

// 内容脚本主类
class ContentScript {
  private novelDetector: NovelDetector;
  private speechReader: SpeechReader | null = null;
  private currentNovelContent: NovelDetectionResult | null = null;
  private settings: UserSettings;
  private floatingControl: HTMLElement | null = null;
  private isInitialized: boolean = false;

  constructor() {
    this.novelDetector = new NovelDetector();
    this.settings = {
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
      // 加载用户设置
      this.settings = await StorageManager.getUserSettings();
      
      // 如果启用自动检测，检测小说内容
      if (this.settings.autoDetect) {
        await this.detectAndSetupNovelContent();
      }

      // 监听来自 background script 的消息
      this.setupMessageListeners();

      // 监听页面变化
      this.setupMutationObserver();

      this.isInitialized = true;
      console.log('AI Reading content script initialized');
    } catch (error) {
      console.error('Failed to initialize content script:', error);
    }
  }

  // 检测并设置小说内容
  private async detectAndSetupNovelContent(): Promise<void> {
    try {
      const detectionResult = await this.novelDetector.detectNovelContent();
      
      if (detectionResult.isNovel && detectionResult.confidence > 0.7) {
        this.currentNovelContent = detectionResult;
        this.createFloatingControl();
        
        // 通知 background script 检测到小说内容
        chrome.runtime.sendMessage({
          type: 'NOVEL_DETECTED',
          data: {
            url: window.location.href,
            title: detectionResult.title,
            confidence: detectionResult.confidence,
          },
        });
      }
    } catch (error) {
      console.error('Failed to detect novel content:', error);
    }
  }

  // 设置消息监听器
  private setupMessageListeners(): void {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // 保持消息通道开启
    });
  }

  // 处理消息
  private async handleMessage(
    message: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ): Promise<void> {
    try {
      switch (message.type) {
        case 'DETECT_CONTENT':
          const result = await this.novelDetector.detectNovelContent();
          sendResponse({ result });
          break;

        case 'START_READING':
          await this.startReading(message.data);
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

        case 'GET_READING_STATE':
          const state = this.speechReader ? this.speechReader.getState() : ReadingState.IDLE;
          const progress = this.speechReader ? this.speechReader.getProgress() : null;
          sendResponse({ state, progress });
          break;

        case 'UPDATE_SETTINGS':
          await this.updateSettings(message.data);
          sendResponse({ success: true });
          break;

        case 'STATE_UPDATED':
          this.handleStateUpdate(message.state);
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ error: (error as Error).message });
    }
  }

  // 开始朗读
  private async startReading(data?: any): Promise<void> {
    if (!this.currentNovelContent) {
      // 如果没有检测到内容，尝试重新检测
      await this.detectAndSetupNovelContent();
      if (!this.currentNovelContent) {
        throw new Error('No novel content detected');
      }
    }

    // 创建或更新朗读器
    if (!this.speechReader) {
      this.speechReader = new SpeechReader(this.settings);
      this.setupReaderEventListeners();
    }

    // 开始朗读
    await this.speechReader.start({
      text: this.currentNovelContent.content,
      startPosition: data?.position || 0,
      settings: this.settings,
    });

    // 更新浮动控件状态
    this.updateFloatingControl();

    // 保存阅读进度
    await this.saveReadingProgress();
  }

  // 停止朗读
  private stopReading(): void {
    if (this.speechReader) {
      this.speechReader.stop();
    }
    this.updateFloatingControl();
  }

  // 暂停朗读
  private pauseReading(): void {
    if (this.speechReader) {
      this.speechReader.pause();
    }
    this.updateFloatingControl();
  }

  // 恢复朗读
  private resumeReading(): void {
    if (this.speechReader) {
      this.speechReader.resume();
    }
    this.updateFloatingControl();
  }

  // 更新设置
  private async updateSettings(newSettings: Partial<UserSettings>): Promise<void> {
    this.settings = { ...this.settings, ...newSettings };
    
    if (this.speechReader) {
      this.speechReader.updateSettings(newSettings);
    }

    // 如果自动检测设置改变，重新处理
    if ('autoDetect' in newSettings) {
      if (newSettings.autoDetect && !this.currentNovelContent) {
        await this.detectAndSetupNovelContent();
      } else if (!newSettings.autoDetect && this.floatingControl) {
        this.removeFloatingControl();
      }
    }
  }

  // 设置朗读器事件监听器
  private setupReaderEventListeners(): void {
    if (!this.speechReader) return;

    this.speechReader.addEventListener('start', (event: ReadingEvent) => {
      this.onReadingStart(event);
    });

    this.speechReader.addEventListener('pause', (event: ReadingEvent) => {
      this.onReadingPause(event);
    });

    this.speechReader.addEventListener('resume', (event: ReadingEvent) => {
      this.onReadingResume(event);
    });

    this.speechReader.addEventListener('stop', (event: ReadingEvent) => {
      this.onReadingStop(event);
    });

    this.speechReader.addEventListener('end', (event: ReadingEvent) => {
      this.onReadingEnd(event);
    });

    this.speechReader.addEventListener('progress', (event: ReadingEvent) => {
      this.onReadingProgress(event);
    });
  }

  // 朗读事件处理器
  private onReadingStart(event: ReadingEvent): void {
    console.log('Reading started');
    this.highlightCurrentSentence();
  }

  private onReadingPause(event: ReadingEvent): void {
    console.log('Reading paused at position:', event.position);
    this.saveReadingProgress();
  }

  private onReadingResume(event: ReadingEvent): void {
    console.log('Reading resumed');
  }

  private onReadingStop(event: ReadingEvent): void {
    console.log('Reading stopped');
    this.clearHighlight();
    this.saveReadingProgress();
  }

  private onReadingEnd(event: ReadingEvent): void {
    console.log('Reading completed');
    this.clearHighlight();
    this.saveReadingProgress();
  }

  private onReadingProgress(event: ReadingEvent): void {
    this.highlightCurrentSentence();
    this.updateFloatingControl();
    
    // 定期保存进度
    if (event.position && event.position % 10 === 0) {
      this.saveReadingProgress();
    }
  }

  // 创建浮动控件
  private createFloatingControl(): void {
    if (this.floatingControl) return;

    this.floatingControl = document.createElement('div');
    this.floatingControl.id = 'ai-reading-control';
    this.floatingControl.innerHTML = `
      <div class="ai-reading-control-panel">
        <button id="ai-reading-play-btn" title="播放/暂停">▶️</button>
        <button id="ai-reading-stop-btn" title="停止">⏹️</button>
        <button id="ai-reading-prev-btn" title="上一句">⏮️</button>
        <button id="ai-reading-next-btn" title="下一句">⏭️</button>
        <span id="ai-reading-progress">0%</span>
        <button id="ai-reading-close-btn" title="关闭">✖️</button>
      </div>
    `;

    // 添加样式
    this.addFloatingControlStyles();

    // 添加事件监听器
    this.setupFloatingControlEvents();

    // 添加到页面
    document.body.appendChild(this.floatingControl);

    // 使其可拖拽
    this.makeFloatingControlDraggable();
  }

  // 添加浮动控件样式
  private addFloatingControlStyles(): void {
    if (document.getElementById('ai-reading-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'ai-reading-styles';
    styles.textContent = `
      #ai-reading-control {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 999999;
        background: rgba(0, 0, 0, 0.8);
        border-radius: 8px;
        padding: 10px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        user-select: none;
        cursor: move;
      }
      
      .ai-reading-control-panel {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .ai-reading-control-panel button {
        background: transparent;
        border: none;
        color: white;
        font-size: 16px;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: background-color 0.2s;
      }
      
      .ai-reading-control-panel button:hover {
        background: rgba(255, 255, 255, 0.2);
      }
      
      #ai-reading-progress {
        color: white;
        font-size: 12px;
        min-width: 40px;
        text-align: center;
      }
      
      .ai-reading-highlight {
        background-color: yellow !important;
        color: black !important;
        padding: 2px 4px;
        border-radius: 3px;
      }
    `;
    
    document.head.appendChild(styles);
  }

  // 设置浮动控件事件
  private setupFloatingControlEvents(): void {
    if (!this.floatingControl) return;

    const playBtn = this.floatingControl.querySelector('#ai-reading-play-btn');
    const stopBtn = this.floatingControl.querySelector('#ai-reading-stop-btn');
    const prevBtn = this.floatingControl.querySelector('#ai-reading-prev-btn');
    const nextBtn = this.floatingControl.querySelector('#ai-reading-next-btn');
    const closeBtn = this.floatingControl.querySelector('#ai-reading-close-btn');

    playBtn?.addEventListener('click', () => {
      if (this.speechReader) {
        const state = this.speechReader.getState();
        if (state === ReadingState.PLAYING) {
          this.pauseReading();
        } else if (state === ReadingState.PAUSED) {
          this.resumeReading();
        } else {
          this.startReading();
        }
      } else {
        this.startReading();
      }
    });

    stopBtn?.addEventListener('click', () => {
      this.stopReading();
    });

    prevBtn?.addEventListener('click', () => {
      if (this.speechReader) {
        this.speechReader.previousSentence();
      }
    });

    nextBtn?.addEventListener('click', () => {
      if (this.speechReader) {
        this.speechReader.nextSentence();
      }
    });

    closeBtn?.addEventListener('click', () => {
      this.removeFloatingControl();
    });
  }

  // 更新浮动控件状态
  private updateFloatingControl(): void {
    if (!this.floatingControl || !this.speechReader) return;

    const playBtn = this.floatingControl.querySelector('#ai-reading-play-btn');
    const progressSpan = this.floatingControl.querySelector('#ai-reading-progress');

    const state = this.speechReader.getState();
    const progress = this.speechReader.getProgress();

    // 更新播放按钮
    if (playBtn) {
      playBtn.textContent = state === ReadingState.PLAYING ? '⏸️' : '▶️';
    }

    // 更新进度
    if (progressSpan) {
      progressSpan.textContent = `${Math.round(progress.percentage)}%`;
    }
  }

  // 使浮动控件可拖拽
  private makeFloatingControlDraggable(): void {
    if (!this.floatingControl) return;

    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;

    this.floatingControl.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      startLeft = parseInt(window.getComputedStyle(this.floatingControl!).left);
      startTop = parseInt(window.getComputedStyle(this.floatingControl!).top);
      
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging || !this.floatingControl) return;

      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      this.floatingControl.style.left = `${startLeft + deltaX}px`;
      this.floatingControl.style.top = `${startTop + deltaY}px`;
      this.floatingControl.style.right = 'auto';
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
    });
  }

  // 移除浮动控件
  private removeFloatingControl(): void {
    if (this.floatingControl) {
      this.floatingControl.remove();
      this.floatingControl = null;
    }
    
    const styles = document.getElementById('ai-reading-styles');
    if (styles) {
      styles.remove();
    }
    
    this.clearHighlight();
  }

  // 高亮当前句子
  private highlightCurrentSentence(): void {
    if (!this.speechReader) return;

    const currentSentence = this.speechReader.getCurrentSentence();
    if (!currentSentence) return;

    // 清除之前的高亮
    this.clearHighlight();

    // 查找包含当前句子的元素
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null
    );

    let node;
    while ((node = walker.nextNode())) {
      const text = node.textContent || '';
      const index = text.indexOf(currentSentence.substring(0, 20)); // 匹配前20字符
      
      if (index >= 0) {
        const parent = node.parentElement;
        if (parent) {
          parent.classList.add('ai-reading-highlight');
          break;
        }
      }
    }
  }

  // 清除高亮
  private clearHighlight(): void {
    const highlighted = document.querySelectorAll('.ai-reading-highlight');
    highlighted.forEach(element => {
      element.classList.remove('ai-reading-highlight');
    });
  }

  // 保存阅读进度
  private async saveReadingProgress(): Promise<void> {
    if (!this.speechReader || !this.currentNovelContent) return;

    try {
      const progress = this.speechReader.getProgress();
      await StorageManager.saveReadingProgress({
        url: window.location.href,
        position: progress.current,
        timestamp: new Date().toISOString(),
        title: this.currentNovelContent.title || document.title,
      });
    } catch (error) {
      console.error('Failed to save reading progress:', error);
    }
  }

  // 设置变化监听器
  private setupMutationObserver(): void {
    const observer = new MutationObserver((mutations) => {
      let shouldRedetect = false;

      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // 检查是否有重要的DOM变化
          const hasSignificantChange = Array.from(mutation.addedNodes).some(node => {
            return node.nodeType === Node.ELEMENT_NODE && 
                   (node as Element).textContent && 
                   (node as Element).textContent!.length > 100;
          });
          
          if (hasSignificantChange) {
            shouldRedetect = true;
          }
        }
      });

      if (shouldRedetect && this.settings.autoDetect) {
        // 延迟重新检测，避免频繁执行
        setTimeout(() => {
          this.detectAndSetupNovelContent();
        }, 1000);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  // 处理状态更新
  private handleStateUpdate(state: any): void {
    // 处理来自 background script 的状态更新
    console.log('State updated:', state);
  }
}

// 初始化内容脚本
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ContentScript();
  });
} else {
  new ContentScript();
}