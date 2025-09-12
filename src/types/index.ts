// 核心接口和类型定义

import { Ref } from 'vue'

// ===== 用户设置相关 =====
export interface UserSettings {
  voiceType: string
  speechRate: number
  volume: number
  autoDetect: boolean
  favoriteVoices: string[]
}

// ===== 阅读器状态相关 =====
export interface ReaderState {
  isReading: boolean
  isPaused: boolean
  currentPosition: number
  totalLength: number
  currentChapter?: string
}

export interface ProgressInfo {
  current: number
  total: number
  percentage: number
  chapter?: string
  estimatedTimeRemaining?: number
}

export interface ReadingProgress {
  url: string
  position: number
  timestamp: string
  title: string
}

// ===== 小说检测相关 =====
export interface DetectionResult {
  isNovel: boolean
  title: string
  chapters: NovelChapter[]
  currentChapterIndex: number
  totalWordCount: number
  estimatedReadingTime: number
}

export interface NovelChapter {
  title: string
  content: string[]
  wordCount: number
}

export interface SiteRule {
  domain: string
  titleSelector: string
  contentSelector: string
  chapterSelector?: string
  nextChapterSelector?: string
  enabled: boolean
}

// ===== 消息传递相关 =====
export interface Message<T = any> {
  type: string
  data?: T
  timestamp: number
  id: string
}

export interface MessageResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

export type MessageHandler<T = any> = (message: Message<T>) => Promise<MessageResponse> | MessageResponse

// ===== 扩展消息类型 =====
export interface StartReadingMessage {
  type: 'START_READING'
  data: {
    position?: number
    chapter?: number
  }
}

export interface PauseReadingMessage {
  type: 'PAUSE_READING'
}

export interface StopReadingMessage {
  type: 'STOP_READING'
}

export interface UpdateSettingsMessage {
  type: 'UPDATE_SETTINGS'
  data: Partial<UserSettings>
}

export interface GetStateMessage {
  type: 'GET_READING_STATE'
}

export interface DetectContentMessage {
  type: 'DETECT_CONTENT'
}

export type ExtensionMessage = 
  | StartReadingMessage
  | PauseReadingMessage
  | StopReadingMessage
  | UpdateSettingsMessage
  | GetStateMessage
  | DetectContentMessage

// ===== 语音合成相关 =====
export interface VoiceInfo {
  name: string
  lang: string
  localService: boolean
  default: boolean
  voiceURI: string
}

export interface SpeechSettings {
  voice: SpeechSynthesisVoice | null
  rate: number
  pitch: number
  volume: number
}

// ===== Vue Composables 类型 =====
export interface UseReaderControllerReturn {
  // 状态
  isReading: Ref<boolean>
  isPaused: Ref<boolean>
  progress: Ref<ProgressInfo>
  detectionResult: Ref<DetectionResult | null>
  
  // 方法
  play: () => Promise<void>
  pause: () => Promise<void>
  stop: () => Promise<void>
  detectContent: () => Promise<void>
  seekTo: (position: number) => Promise<void>
}

export interface UseSettingsReturn {
  // 状态
  settings: Ref<UserSettings>
  loading: Ref<boolean>
  error: Ref<string | null>
  
  // 方法
  loadSettings: () => Promise<void>
  saveSettings: (newSettings: Partial<UserSettings>) => Promise<void>
  resetSettings: () => Promise<void>
  exportSettings: () => Promise<string>
  importSettings: (data: string) => Promise<void>
}

export interface UseExtensionMessagingReturn {
  // 状态
  connected: Ref<boolean>
  lastError: Ref<string | null>
  
  // 方法
  sendToContent: <T>(message: ExtensionMessage) => Promise<T>
  sendToBackground: <T>(message: ExtensionMessage) => Promise<T>
  onMessage: (handler: MessageHandler) => void
  removeMessageListener: (handler: MessageHandler) => void
}

// ===== 组件 Props 类型 =====
export interface StatusIndicatorProps {
  isActive: boolean
  message: string
  type?: 'success' | 'warning' | 'error' | 'info'
}

export interface PlaybackControlsProps {
  isReading: boolean
  isPaused: boolean
  disabled?: boolean
}

export interface ProgressBarProps {
  current: number
  total: number
  showPercentage?: boolean
  showTime?: boolean
}

export interface QuickSettingsProps {
  speechRate: number
  volume: number
  onSpeechRateChange: (rate: number) => void
  onVolumeChange: (volume: number) => void
}

export interface VoiceSettingsProps {
  voices: VoiceInfo[]
  selectedVoice: string
  favoriteVoices: string[]
  onVoiceSelect: (voice: string) => void
  onToggleFavorite: (voice: string) => void
}

// ===== 事件类型 =====
export interface PlaybackEvent {
  type: 'play' | 'pause' | 'stop' | 'seek'
  position?: number
  timestamp: number
}

export interface SettingsChangeEvent {
  type: 'settings-change'
  changes: Partial<UserSettings>
  timestamp: number
}

export interface DetectionEvent {
  type: 'content-detected' | 'detection-failed'
  result?: DetectionResult
  error?: string
  timestamp: number
}

// ===== 工具类型 =====
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

// ===== 默认值 =====
export const DEFAULT_USER_SETTINGS: UserSettings = {
  voiceType: '',
  speechRate: 1.0,
  volume: 0.8,
  autoDetect: true,
  favoriteVoices: []
}

export const DEFAULT_PROGRESS_INFO: ProgressInfo = {
  current: 0,
  total: 0,
  percentage: 0
}

export const DEFAULT_READER_STATE: ReaderState = {
  isReading: false,
  isPaused: false,
  currentPosition: 0,
  totalLength: 0
}

// ===== Chrome 扩展相关类型增强 =====
declare global {
  interface Window {
    chrome: typeof chrome
  }
}

// ===== 错误类型 =====
export class ExtensionError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message)
    this.name = 'ExtensionError'
  }
}

export class ReaderError extends ExtensionError {
  constructor(message: string, details?: any) {
    super(message, 'READER_ERROR', details)
    this.name = 'ReaderError'
  }
}

export class SettingsError extends ExtensionError {
  constructor(message: string, details?: any) {
    super(message, 'SETTINGS_ERROR', details)
    this.name = 'SettingsError'
  }
}

export class DetectionError extends ExtensionError {
  constructor(message: string, details?: any) {
    super(message, 'DETECTION_ERROR', details)
    this.name = 'DetectionError'
  }
}