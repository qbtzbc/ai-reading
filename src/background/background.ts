import { StorageManager, UserSettings } from '@/utils/storage';

// 插件状态管理
interface ExtensionState {
  isReading: boolean;
  currentUrl: string;
  currentPosition: number;
}

class BackgroundService {
  private state: ExtensionState = {
    isReading: false,
    currentUrl: '',
    currentPosition: 0,
  };

  constructor() {
    this.initializeExtension();
  }

  // 初始化插件
  private initializeExtension(): void {
    // 监听插件安装事件
    chrome.runtime.onInstalled.addListener((details) => {
      this.handleInstalled(details);
    });

    // 监听来自 content script 和 popup 的消息
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // 保持消息通道开启
    });

    // 监听标签页切换
    chrome.tabs.onActivated.addListener((activeInfo) => {
      this.handleTabActivated(activeInfo);
    });

    // 监听标签页更新
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      this.handleTabUpdated(tabId, changeInfo, tab);
    });
  }

  // 处理插件安装
  private async handleInstalled(details: chrome.runtime.InstalledDetails): Promise<void> {
    if (details.reason === 'install') {
      console.log('AI Reading extension installed');
      
      // 初始化默认设置
      await this.initializeDefaultSettings();
      
      // 打开欢迎页面
      chrome.tabs.create({
        url: chrome.runtime.getURL('options.html'),
      });
    }
  }

  // 初始化默认设置
  private async initializeDefaultSettings(): Promise<void> {
    try {
      const existingSettings = await StorageManager.getUserSettings();
      
      // 如果是首次安装，设置默认语音
      if (!existingSettings.voiceType) {
        const voices = speechSynthesis.getVoices();
        const chineseVoice = voices.find(voice => 
          voice.lang.startsWith('zh') || voice.name.includes('中文')
        );
        
        if (chineseVoice) {
          await StorageManager.saveUserSettings({
            voiceType: chineseVoice.name,
          });
        }
      }
    } catch (error) {
      console.error('Failed to initialize default settings:', error);
    }
  }

  // 处理消息
  private async handleMessage(
    message: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ): Promise<void> {
    try {
      switch (message.type) {
        case 'GET_STATE':
          sendResponse({ state: this.state });
          break;

        case 'UPDATE_STATE':
          this.updateState(message.data);
          sendResponse({ success: true });
          break;

        case 'START_READING':
          await this.startReading(message.data);
          sendResponse({ success: true });
          break;

        case 'STOP_READING':
          await this.stopReading();
          sendResponse({ success: true });
          break;

        case 'GET_SETTINGS':
          const settings = await StorageManager.getUserSettings();
          sendResponse({ settings });
          break;

        case 'SAVE_SETTINGS':
          await StorageManager.saveUserSettings(message.data);
          sendResponse({ success: true });
          break;

        case 'GET_PROGRESS':
          const progress = await StorageManager.getReadingProgress(message.url);
          sendResponse({ progress });
          break;

        case 'SAVE_PROGRESS':
          await StorageManager.saveReadingProgress(message.data);
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

  // 更新状态
  private updateState(newState: Partial<ExtensionState>): void {
    this.state = { ...this.state, ...newState };
    
    // 通知所有标签页状态更新
    this.broadcastStateUpdate();
  }

  // 开始朗读
  private async startReading(data: any): Promise<void> {
    this.updateState({
      isReading: true,
      currentUrl: data.url,
      currentPosition: data.position || 0,
    });

    // 更新图标状态
    this.updateIcon(true);
  }

  // 停止朗读
  private async stopReading(): Promise<void> {
    this.updateState({
      isReading: false,
    });

    // 更新图标状态
    this.updateIcon(false);
  }

  // 更新插件图标
  private updateIcon(isActive: boolean): void {
    const iconPath = isActive ? 'assets/icons/icon-active' : 'assets/icons/icon';
    
    chrome.action.setIcon({
      path: {
        16: `${iconPath}16.png`,
        32: `${iconPath}32.png`,
        48: `${iconPath}48.png`,
        128: `${iconPath}128.png`,
      },
    });
  }

  // 广播状态更新
  private broadcastStateUpdate(): void {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, {
            type: 'STATE_UPDATED',
            state: this.state,
          }).catch(() => {
            // 忽略错误，某些标签页可能没有content script
          });
        }
      });
    });
  }

  // 处理标签页激活
  private handleTabActivated(activeInfo: chrome.tabs.TabActiveInfo): void {
    // 如果切换到新标签页，暂停当前朗读
    if (this.state.isReading) {
      chrome.tabs.get(activeInfo.tabId, (tab) => {
        if (tab.url !== this.state.currentUrl) {
          this.stopReading();
        }
      });
    }
  }

  // 处理标签页更新
  private handleTabUpdated(
    tabId: number,
    changeInfo: chrome.tabs.TabChangeInfo,
    tab: chrome.tabs.Tab
  ): void {
    // 如果当前朗读页面刷新或导航，停止朗读
    if (changeInfo.status === 'loading' && this.state.isReading && tab.url !== this.state.currentUrl) {
      this.stopReading();
    }
  }
}

// 初始化 Background Service
new BackgroundService();