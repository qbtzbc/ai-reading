// AI Reading - 极简化背景服务
// 原生JavaScript实现，无依赖，零构建

console.log('AI Reading background service started');

// 扩展状态管理
class BackgroundService {
  constructor() {
    this.state = {
      isReading: false,
      currentUrl: '',
      speechStatus: { isReading: false, paused: false }
    };
    this.init();
  }

  init() {
    // 监听扩展安装
    chrome.runtime.onInstalled.addListener((details) => {
      console.log('AI Reading installed:', details.reason);
      this.initializeSettings();
    });

    // 监听消息
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // 保持消息通道开放
    });

    // 监听标签页变化
    chrome.tabs.onActivated.addListener(() => {
      this.updateIcon(false); // 切换标签页时重置图标
    });
  }

  // 初始化默认设置
  initializeSettings() {
    chrome.storage.local.set({
      settings: {
        rate: 1.0,
        volume: 0.8,
        autoDetect: true,
        voiceType: ''
      },
      novelData: null,
      speechStatus: { isReading: false, paused: false }
    });
  }

  // 处理消息
  handleMessage(message, sender, sendResponse) {
    console.log('Background received message:', message.type);
    
    switch (message.type) {
      case 'NOVEL_DETECTED':
        this.handleNovelDetected(message.data);
        sendResponse({ success: true });
        break;

      case 'SPEECH_STATUS':
        this.handleSpeechStatus(message.data);
        sendResponse({ success: true });
        break;

      case 'GET_STATUS':
        chrome.storage.local.get(['speechStatus'], (result) => {
          sendResponse(result.speechStatus || { isReading: false, paused: false });
        });
        break;

      case 'GET_SETTINGS':
        chrome.storage.local.get(['settings'], (result) => {
          sendResponse(result.settings || {});
        });
        break;

      case 'SAVE_SETTINGS':
        chrome.storage.local.set({ settings: message.data }, () => {
          sendResponse({ success: true });
        });
        break;

      case 'GET_NOVEL_DATA':
        chrome.storage.local.get(['novelData'], (result) => {
          sendResponse(result.novelData || null);
        });
        break;

      default:
        sendResponse({ error: 'Unknown message type: ' + message.type });
    }
  }

  // 处理小说检测结果
  handleNovelDetected(data) {
    console.log('Novel detected:', data.url);
    chrome.storage.local.set({ novelData: data });
    this.state.currentUrl = data.url;
  }

  // 处理语音状态变化
  handleSpeechStatus(data) {
    console.log('Speech status changed:', data);
    chrome.storage.local.set({ speechStatus: data });
    this.state.speechStatus = data;
    this.updateIcon(data.isReading);
  }

  // 更新扩展图标
  updateIcon(isReading) {
    const iconPath = isReading ? 'icons/icon' : 'icons/icon'; // 暂时使用同一套图标
    
    try {
      chrome.action.setIcon({
        path: {
          16: `${iconPath}16.png`,
          32: `${iconPath}32.png`,
          48: `${iconPath}48.png`,
          128: `${iconPath}128.png`
        }
      });

      // 更新徽章
      chrome.action.setBadgeText({
        text: isReading ? '●' : ''
      });

      chrome.action.setBadgeBackgroundColor({
        color: '#4CAF50'
      });
    } catch (error) {
      console.warn('Failed to update icon:', error);
    }
  }
}

// 启动背景服务
new BackgroundService();