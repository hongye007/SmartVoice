// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// 用户相关
export interface User {
  id: string
  email: string
  username: string
  quota: number
  createdAt: string
}

export interface AuthResponse {
  user: User
  token: string
}

// 项目相关
export enum ProjectStatus {
  PENDING = 'PENDING',
  PARSING = 'PARSING',
  READY = 'READY',
  GENERATING = 'GENERATING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface Project {
  id: string
  name: string
  description?: string
  status: ProjectStatus
  fileUrl: string
  totalWords: number
  createdAt: string
  updatedAt: string
  _count?: {
    chapters: number
    characters: number
    audios: number
  }
}

// 章节相关
export enum ChapterStatus {
  PENDING = 'PENDING',
  READY = 'READY',
  GENERATING = 'GENERATING',
  COMPLETED = 'COMPLETED',
}

export interface Chapter {
  id: string
  projectId: string
  title: string
  content: string
  order: number
  wordCount: number
  status: ChapterStatus
  createdAt: string
  updatedAt: string
}

// 角色相关
export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  UNKNOWN = 'UNKNOWN',
}

export interface Character {
  id: string
  projectId: string
  name: string
  gender: Gender
  voiceId?: string
  voiceConfig?: any
  dialogueCount: number
  createdAt: string
  updatedAt: string
}

// 音色相关
export interface Voice {
  id: string
  name: string
  gender: 'MALE' | 'FEMALE' | 'CHILD'
  language: string
  description?: string
  provider: string
  sampleUrl?: string
}

// 音频相关
export enum AudioStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface Audio {
  id: string
  projectId: string
  chapterId: string
  url: string
  duration: number
  fileSize: number
  status: AudioStatus
  errorMsg?: string
  createdAt: string
  updatedAt: string
}

// 任务相关
export interface JobProgress {
  percentage: number
  message?: string
  currentStep?: string
  totalSteps?: number
}

export interface JobStatus {
  jobId: string
  queueName: string
  state: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed'
  progress?: JobProgress
  failedReason?: string
  attemptsMade: number
  data: any
  returnValue?: any
  createdAt: string
  processedAt?: string
  finishedAt?: string
}
