// 任务队列相关类型定义

// 任务类型
export enum QueueName {
  AUDIO_GENERATION = 'audio-generation',
  TEXT_PARSING = 'text-parsing',
}

// 音频生成任务数据
export interface AudioGenerationJobData {
  chapterId: string
  userId: string
  projectId: string
}

// 文本解析任务数据
export interface TextParsingJobData {
  projectId: string
  userId: string
  useAI?: boolean
}

// 任务进度
export interface JobProgress {
  percentage: number
  message?: string
  currentStep?: string
  totalSteps?: number
}

// 任务结果
export interface JobResult {
  success: boolean
  data?: any
  error?: string
}
