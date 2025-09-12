import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { 
  UseReaderControllerReturn, 
  DetectionResult, 
  ProgressInfo,
  ExtensionMessage,
  MessageResponse
} from '@/types'
import { DEFAULT_PROGRESS_INFO, ReaderError } from '@/types'
import { useExtensionMessaging } from './useExtensionMessaging'

export function useReaderController(): UseReaderControllerReturn {
  // 状态
  const isReading = ref(false)
  const isPaused = ref(false)
  const progress = ref<ProgressInfo>({ ...DEFAULT_PROGRESS_INFO })
  const detectionResult = ref<DetectionResult | null>(null)
  const error = ref<string | null>(null)

  // 使用消息通信
  const { sendToContent, onMessage } = useExtensionMessaging()

  // 计算属性
  const canPlay = computed(() => {
    return detectionResult.value?.isNovel && !isReading.value
  })

  const canPause = computed(() => {
    return isReading.value && !isPaused.value
  })

  const canStop = computed(() => {
    return isReading.value || progress.value.current > 0
  })

  // 播放
  const play = async (): Promise<void> => {
    if (!canPlay.value && !isPaused.value) {
      throw new ReaderError('Cannot start reading: no content detected or already reading')
    }

    try {
      error.value = null
      
      const response = await sendToContent<any>({
        type: 'START_READING',
        data: { position: progress.value.current },
        timestamp: Date.now(),
        id: generateId()
      })

      if (response.success) {
        isReading.value = true
        isPaused.value = false
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start reading'
      error.value = errorMessage
      console.error('Failed to start reading:', err)
      throw new ReaderError(errorMessage, err)
    }
  }

  // 暂停
  const pause = async (): Promise<void> => {
    if (!canPause.value) {
      throw new ReaderError('Cannot pause: not reading or already paused')
    }

    try {
      error.value = null
      
      await sendToContent<any>({
        type: 'PAUSE_READING',
        timestamp: Date.now(),
        id: generateId()
      })

      isPaused.value = true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to pause reading'
      error.value = errorMessage
      console.error('Failed to pause reading:', err)
      throw new ReaderError(errorMessage, err)
    }
  }

  // 停止
  const stop = async (): Promise<void> => {
    if (!canStop.value) {
      throw new ReaderError('Cannot stop: not reading and no progress')
    }

    try {
      error.value = null
      
      await sendToContent<any>({
        type: 'STOP_READING',
        timestamp: Date.now(),
        id: generateId()
      })

      isReading.value = false
      isPaused.value = false
      progress.value = { ...DEFAULT_PROGRESS_INFO }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to stop reading'
      error.value = errorMessage
      console.error('Failed to stop reading:', err)
      throw new ReaderError(errorMessage, err)
    }
  }

  // 检测内容
  const detectContent = async (): Promise<void> => {
    try {
      error.value = null
      
      const response = await sendToContent<{ result: DetectionResult }>({
        type: 'DETECT_CONTENT',
        timestamp: Date.now(),
        id: generateId()
      })

      if (response && response.result) {
        detectionResult.value = response.result
      } else {
        detectionResult.value = null
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to detect content'
      error.value = errorMessage
      console.error('Failed to detect content:', err)
      detectionResult.value = null
      throw new ReaderError(errorMessage, err)
    }
  }

  // 跳转到指定位置
  const seekTo = async (position: number): Promise<void> => {
    if (!detectionResult.value?.isNovel) {
      throw new ReaderError('Cannot seek: no content detected')
    }

    try {
      error.value = null
      
      await sendToContent<any>({
        type: 'SEEK_TO',
        data: { position },
        timestamp: Date.now(),
        id: generateId()
      })

      progress.value.current = position
      progress.value.percentage = progress.value.total > 0 
        ? (position / progress.value.total) * 100 
        : 0
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to seek'
      error.value = errorMessage
      console.error('Failed to seek:', err)
      throw new ReaderError(errorMessage, err)
    }
  }

  // 获取当前状态
  const getCurrentState = async (): Promise<void> => {
    try {
      const response = await sendToContent<{
        state: string
        progress: ProgressInfo
        detection: DetectionResult | null
      }>({
        type: 'GET_READING_STATE',
        timestamp: Date.now(),
        id: generateId()
      })

      if (response) {
        isReading.value = response.state === 'playing'
        isPaused.value = response.state === 'paused'
        
        if (response.progress) {
          progress.value = response.progress
        }
        
        if (response.detection) {
          detectionResult.value = response.detection
        }
      }
    } catch (err) {
      console.warn('Failed to get current state:', err)
      // 不抛出错误，因为这是初始化调用
    }
  }

  // 处理来自 content script 的消息
  const handleContentMessage = async (message: ExtensionMessage): Promise<MessageResponse | null> => {
    switch (message.type) {
      case 'READING_STATE_CHANGED':
        if (message.data) {
          isReading.value = message.data.isReading
          isPaused.value = message.data.isPaused
        }
        return { success: true }

      case 'PROGRESS_UPDATED':
        if (message.data) {
          progress.value = { ...progress.value, ...message.data }
        }
        return { success: true }

      case 'DETECTION_COMPLETED':
        if (message.data) {
          detectionResult.value = message.data.result
        }
        return { success: true }

      default:
        return null
    }
  }

  // 生成唯一 ID
  const generateId = (): string => {
    return `reader_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // 组件挂载时初始化
  onMounted(() => {
    // 注册消息处理器
    onMessage(handleContentMessage)
    
    // 获取初始状态
    getCurrentState()
  })

  return {
    isReading,
    isPaused,
    progress,
    detectionResult,
    play,
    pause,
    stop,
    detectContent,
    seekTo
  }
}