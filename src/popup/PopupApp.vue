<template>
  <div class="popup-container">
    <header class="popup-header">
      <h1>AI Reading</h1>
      <span class="version">v2.0.0</span>
    </header>
    
    <main class="popup-main">
      <!-- 状态指示器 -->
      <div class="status-section">
        <StatusIndicator
          :is-active="!!detectionResult?.isNovel"
          :message="statusMessage"
          :type="statusType"
        />
      </div>
      
      <!-- 播放控制 -->
      <div class="controls-section">
        <PlaybackControls
          :is-reading="isReading"
          :is-paused="isPaused"
          :disabled="!detectionResult?.isNovel"
          :has-progress="progress.current > 0"
          @play="handlePlay"
          @pause="handlePause"
          @resume="handleResume"
          @stop="handleStop"
        />
        
        <!-- 进度条 -->
        <ProgressBar
          :current="progress.current"
          :total="progress.total"
          :percentage="progress.percentage"
          :estimated-time="progress.estimatedTimeRemaining"
          :show-time="true"
          @seek="handleSeek"
        />
      </div>
      
      <!-- 快速设置 -->
      <QuickSettings
        v-model:speech-rate="settings.speechRate"
        v-model:volume="settings.volume"
        @speech-rate-change="handleSettingsChange"
        @volume-change="handleSettingsChange"
      />
    </main>
    
    <!-- 底部操作按钮 -->
    <footer class="popup-footer">
      <ActionButtons
        :detecting="detecting"
        @detect="handleDetect"
        @open-settings="handleOpenSettings"
      />
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import StatusIndicator from './components/StatusIndicator.vue'
import PlaybackControls from './components/PlaybackControls.vue'
import ProgressBar from './components/ProgressBar.vue'
import QuickSettings from './components/QuickSettings.vue'
import ActionButtons from './components/ActionButtons.vue'
import { useReaderController } from '@/composables/useReaderController'
import { useSettings } from '@/composables/useSettings'
import type { DetectionResult } from '@/types'

// 使用组合式 API
const {
  isReading,
  isPaused,
  progress,
  detectionResult,
  play,
  pause,
  stop,
  detectContent,
  seekTo
} = useReaderController()

const {
  settings,
  saveSettings
} = useSettings()

// 本地状态
const detecting = ref(false)

// 计算属性
const statusMessage = computed(() => {
  if (!detectionResult.value) {
    return '正在检测内容...'
  }
  
  if (detectionResult.value.isNovel) {
    return detectionResult.value.title || '检测到小说内容'
  }
  
  return '未检测到小说内容'
})

const statusType = computed(() => {
  if (!detectionResult.value) {
    return 'info'
  }
  
  return detectionResult.value.isNovel ? 'success' : 'warning'
})

// 方法
const handlePlay = async () => {
  try {
    await play()
  } catch (error) {
    console.error('播放失败:', error)
  }
}

const handlePause = async () => {
  try {
    await pause()
  } catch (error) {
    console.error('暂停失败:', error)
  }
}

const handleResume = async () => {
  try {
    await play()
  } catch (error) {
    console.error('继续播放失败:', error)
  }
}

const handleStop = async () => {
  try {
    await stop()
  } catch (error) {
    console.error('停止失败:', error)
  }
}

const handleSeek = async (position: number) => {
  try {
    await seekTo(position)
  } catch (error) {
    console.error('跳转失败:', error)
  }
}

const handleDetect = async () => {
  detecting.value = true
  try {
    await detectContent()
  } catch (error) {
    console.error('检测失败:', error)
  } finally {
    detecting.value = false
  }
}

const handleOpenSettings = () => {
  chrome.runtime.openOptionsPage()
}

const handleSettingsChange = async () => {
  try {
    await saveSettings(settings.value)
  } catch (error) {
    console.error('保存设置失败:', error)
  }
}

// 生命周期
onMounted(async () => {
  // 初始化时检测内容
  await handleDetect()
})

onUnmounted(() => {
  // 清理工作
})
</script>

<style lang="scss">
@import '@/styles/global.scss';

.popup-container {
  width: $container-width;
  min-height: 400px;
  font-family: $font-family-sans;
  background: $white;
  border-radius: $border-radius-lg;
  overflow: hidden;
  box-shadow: $shadow-lg;
}

.popup-header {
  @include gradient-primary;
  color: $white;
  padding: $spacing-4;
  text-align: center;

  h1 {
    margin: 0;
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
  }

  .version {
    font-size: $font-size-xs;
    opacity: 0.8;
  }
}

.popup-main {
  padding: $spacing-4;
}

.status-section {
  margin-bottom: $spacing-5;
}

.controls-section {
  margin-bottom: $spacing-5;
}

.popup-footer {
  margin-top: auto;
}
</style>