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
    // 使用不同状态的图标路径（如果需要）
    const iconPath = 'icons/icon'; // 现在使用同一套图标
    
    // 更新图标（带错误处理）
    this.setActionIcon(iconPath).then(() => {
      console.log('Icon updated successfully');
    }).catch(error => {
      console.warn('Failed to update icon:', error);
      // 图标设置失败不影响功能，只记录警告
    });

    // 更新徽章（带错误处理）
    this.setBadge(isReading).catch(error => {
      console.warn('Failed to update badge:', error);
    });
  }
  
  // 设置图标（带Promise支持）
  setActionIcon(iconPath) {
    return new Promise((resolve, reject) => {
      try {
        chrome.action.setIcon({
          path: {
            16: `${iconPath}16.png`,
            32: `${iconPath}32.png`,
            48: `${iconPath}48.png`,
            128: `${iconPath}128.png`
          }
        }, () => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve();
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }
  
  // 设置徽章（带Promise支持）
  setBadge(isReading) {
    return Promise.all([
      // 设置徽章文本
      new Promise((resolve, reject) => {
        chrome.action.setBadgeText({
          text: isReading ? '●' : ''
        }, () => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve();
          }
        });
      }),
      // 设置徽章背景色
      new Promise((resolve, reject) => {
        if (isReading) {
          chrome.action.setBadgeBackgroundColor({
            color: '#4CAF50'
          }, () => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve();
            }
          });
        } else {
          resolve(); // 不需要设置背景色
        }
      })
    ]);
  }
}

// 启动背景服务
new BackgroundService();