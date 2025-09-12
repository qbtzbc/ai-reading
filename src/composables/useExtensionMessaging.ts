import { ref, onMounted, onUnmounted } from 'vue'
import type { 
  UseExtensionMessagingReturn, 
  ExtensionMessage, 
  MessageHandler,
  MessageResponse 
} from '@/types'

export function useExtensionMessaging(): UseExtensionMessagingReturn {
  const connected = ref(false)
  const lastError = ref<string | null>(null)
  
  // 消息处理器列表
  const messageHandlers = new Set<MessageHandler>()

  // 发送消息到 content script
  const sendToContent = async <T>(message: ExtensionMessage): Promise<T> => {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
      const currentTab = tabs[0]
      
      if (!currentTab.id) {
        throw new Error('No active tab found')
      }

      const response = await chrome.tabs.sendMessage(currentTab.id, {
        ...message,
        timestamp: Date.now(),
        id: generateMessageId()
      })

      if (!response.success) {
        throw new Error(response.error || 'Message failed')
      }

      lastError.value = null
      return response.data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      lastError.value = errorMessage
      console.error('Failed to send message to content script:', error)
      throw error
    }
  }

  // 发送消息到 background script
  const sendToBackground = async <T>(message: ExtensionMessage): Promise<T> => {
    try {
      const response = await chrome.runtime.sendMessage({
        ...message,
        timestamp: Date.now(),
        id: generateMessageId()
      })

      if (!response.success) {
        throw new Error(response.error || 'Message failed')
      }

      lastError.value = null
      return response.data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      lastError.value = errorMessage
      console.error('Failed to send message to background script:', error)
      throw error
    }
  }

  // 添加消息监听器
  const onMessage = (handler: MessageHandler) => {
    messageHandlers.add(handler)
  }

  // 移除消息监听器
  const removeMessageListener = (handler: MessageHandler) => {
    messageHandlers.delete(handler)
  }

  // 内部消息处理函数
  const handleMessage = async (
    message: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: MessageResponse) => void
  ) => {
    try {
      for (const handler of messageHandlers) {
        const response = await handler(message)
        if (response) {
          sendResponse(response)
          return true
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      sendResponse({ success: false, error: errorMessage })
    }
    return true
  }

  // 生成消息 ID
  const generateMessageId = (): string => {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // 检查连接状态
  const checkConnection = async () => {
    try {
      await chrome.runtime.sendMessage({ type: 'PING' })
      connected.value = true
    } catch (error) {
      connected.value = false
    }
  }

  // 组件挂载时设置
  onMounted(() => {
    chrome.runtime.onMessage.addListener(handleMessage)
    checkConnection()
  })

  // 组件卸载时清理
  onUnmounted(() => {
    chrome.runtime.onMessage.removeListener(handleMessage)
    messageHandlers.clear()
  })

  return {
    connected,
    lastError,
    sendToContent,
    sendToBackground,
    onMessage,
    removeMessageListener
  }
}