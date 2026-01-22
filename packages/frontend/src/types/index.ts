// 用户相关类型
export interface User {
  id: string
  email: string
  username: string
  createdAt: string
}

// 项目相关类型
export interface Project {
  id: string
  userId: string
  name: string
  description?: string
  status: 'parsing' | 'ready' | 'generating' | 'completed' | 'failed'
  fileUrl: string
  createdAt: string
  updatedAt: string
}

// 角色相关类型
export interface Character {
  id: string
  projectId: string
  name: string
  gender: 'male' | 'female' | 'unknown'
  voiceId?: string
  dialogueCount: number
}

// 章节相关类型
export interface Chapter {
  id: string
  projectId: string
  title: string
  content: string
  order: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
}

// 音频相关类型
export interface Audio {
  id: string
  projectId: string
  chapterId: string
  url: string
  duration: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  createdAt: string
}

// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}
