import { UserSettings } from '@/utils/storage';
import { TextProcessor } from '@/utils/text-processor';

// 朗读状态
export enum ReadingState {
  IDLE = 'idle',
  PLAYING = 'playing',
  PAUSED = 'paused',
  STOPPED = 'stopped',
}

// 朗读配置
export interface ReadingConfig {
  text: string;
  startPosition?: number;
  settings: UserSettings;
}

// 朗读事件
export interface ReadingEvent {
  type: 'start' | 'pause' | 'resume' | 'stop' | 'end' | 'progress';
  position?: number;
  text?: string;
}

export class SpeechReader {
  private synthesis: SpeechSynthesis;
  private utterance: SpeechSynthesisUtterance | null = null;
  private state: ReadingState = ReadingState.IDLE;
  private currentText: string = '';
  private sentences: string[] = [];
  private currentSentenceIndex: number = 0;
  private settings: UserSettings;
  private listeners: Map<string, Function[]> = new Map();

  constructor(settings: UserSettings) {
    this.synthesis = window.speechSynthesis;
    this.settings = settings;
    this.initializeEventListeners();
  }

  // 初始化事件监听器
  private initializeEventListeners(): void {
    // 监听语音合成事件
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.state === ReadingState.PLAYING) {
        this.pause();
      }
    });

    // 监听页面卸载
    window.addEventListener('beforeunload', () => {
      this.stop();
    });
  }

  // 开始朗读
  async start(config: ReadingConfig): Promise<void> {
    try {
      this.currentText = config.text;
      this.settings = config.settings;
      this.sentences = TextProcessor.splitIntoSentences(config.text);
      this.currentSentenceIndex = config.startPosition || 0;

      if (this.sentences.length === 0) {
        throw new Error('No valid sentences found in text');
      }

      // 确保语音列表已加载
      await this.ensureVoicesLoaded();

      this.state = ReadingState.PLAYING;
      this.emitEvent({ type: 'start' });

      await this.speakCurrentSentence();
    } catch (error) {
      console.error('Failed to start reading:', error);
      this.state = ReadingState.IDLE;
      throw error;
    }
  }

  // 暂停朗读
  pause(): void {
    if (this.state === ReadingState.PLAYING) {
      this.synthesis.pause();
      this.state = ReadingState.PAUSED;
      this.emitEvent({ type: 'pause', position: this.currentSentenceIndex });
    }
  }

  // 恢复朗读
  resume(): void {
    if (this.state === ReadingState.PAUSED) {
      this.synthesis.resume();
      this.state = ReadingState.PLAYING;
      this.emitEvent({ type: 'resume', position: this.currentSentenceIndex });
    }
  }

  // 停止朗读
  stop(): void {
    if (this.utterance) {
      this.synthesis.cancel();
    }
    this.state = ReadingState.STOPPED;
    this.currentSentenceIndex = 0;
    this.emitEvent({ type: 'stop' });
  }

  // 跳转到指定位置
  seekTo(sentenceIndex: number): void {
    if (sentenceIndex >= 0 && sentenceIndex < this.sentences.length) {
      const wasPlaying = this.state === ReadingState.PLAYING;
      this.stop();
      this.currentSentenceIndex = sentenceIndex;
      
      if (wasPlaying) {
        this.speakCurrentSentence();
      }
    }
  }

  // 下一句
  nextSentence(): void {
    if (this.currentSentenceIndex < this.sentences.length - 1) {
      this.seekTo(this.currentSentenceIndex + 1);
    }
  }

  // 上一句
  previousSentence(): void {
    if (this.currentSentenceIndex > 0) {
      this.seekTo(this.currentSentenceIndex - 1);
    }
  }

  // 更新设置
  updateSettings(newSettings: Partial<UserSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    
    // 如果正在朗读，重新开始当前句子
    if (this.state === ReadingState.PLAYING) {
      this.synthesis.cancel();
      this.speakCurrentSentence();
    }
  }

  // 获取当前状态
  getState(): ReadingState {
    return this.state;
  }

  // 获取当前进度
  getProgress(): { current: number; total: number; percentage: number } {
    const total = this.sentences.length;
    const current = this.currentSentenceIndex;
    const percentage = total > 0 ? (current / total) * 100 : 0;
    
    return { current, total, percentage };
  }

  // 获取当前句子
  getCurrentSentence(): string {
    return this.sentences[this.currentSentenceIndex] || '';
  }

  // 朗读当前句子
  private async speakCurrentSentence(): Promise<void> {
    if (this.currentSentenceIndex >= this.sentences.length) {
      this.onReadingComplete();
      return;
    }

    const sentence = this.sentences[this.currentSentenceIndex];
    if (!sentence.trim()) {
      this.currentSentenceIndex++;
      await this.speakCurrentSentence();
      return;
    }

    this.utterance = new SpeechSynthesisUtterance(sentence);
    this.configureUtterance(this.utterance);

    // 设置事件监听器
    this.utterance.onend = () => {
      this.currentSentenceIndex++;
      this.emitEvent({ 
        type: 'progress', 
        position: this.currentSentenceIndex,
        text: sentence 
      });
      
      if (this.state === ReadingState.PLAYING) {
        this.speakCurrentSentence();
      }
    };

    this.utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      this.currentSentenceIndex++;
      if (this.state === ReadingState.PLAYING) {
        this.speakCurrentSentence();
      }
    };

    this.synthesis.speak(this.utterance);
  }

  // 配置语音参数
  private configureUtterance(utterance: SpeechSynthesisUtterance): void {
    const voices = this.synthesis.getVoices();
    
    // 选择语音
    if (this.settings.voiceType) {
      const selectedVoice = voices.find(voice => voice.name === this.settings.voiceType);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    } else {
      // 默认选择中文语音
      const chineseVoice = voices.find(voice => 
        voice.lang.startsWith('zh') || voice.name.includes('中文')
      );
      if (chineseVoice) {
        utterance.voice = chineseVoice;
      }
    }

    // 设置语音参数
    utterance.rate = this.settings.speechRate || 1.0;
    utterance.volume = this.settings.volume || 0.8;
    utterance.pitch = 1.0;
  }

  // 确保语音列表已加载
  private async ensureVoicesLoaded(): Promise<void> {
    return new Promise((resolve) => {
      const voices = this.synthesis.getVoices();
      if (voices.length > 0) {
        resolve();
        return;
      }

      const handleVoicesChanged = () => {
        const newVoices = this.synthesis.getVoices();
        if (newVoices.length > 0) {
          this.synthesis.removeEventListener('voiceschanged', handleVoicesChanged);
          resolve();
        }
      };

      this.synthesis.addEventListener('voiceschanged', handleVoicesChanged);
      
      // 超时保护
      setTimeout(() => {
        this.synthesis.removeEventListener('voiceschanged', handleVoicesChanged);
        resolve();
      }, 3000);
    });
  }

  // 朗读完成
  private onReadingComplete(): void {
    this.state = ReadingState.IDLE;
    this.emitEvent({ type: 'end' });
  }

  // 添加事件监听器
  addEventListener(eventType: string, callback: Function): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(callback);
  }

  // 移除事件监听器
  removeEventListener(eventType: string, callback: Function): void {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // 触发事件
  private emitEvent(event: ReadingEvent): void {
    const callbacks = this.listeners.get(event.type);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in event callback:', error);
        }
      });
    }
  }

  // 获取可用语音列表
  getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.synthesis.getVoices().filter(voice => 
      voice.lang.startsWith('zh') || voice.lang.startsWith('en')
    );
  }

  // 销毁实例
  destroy(): void {
    this.stop();
    this.listeners.clear();
  }
}