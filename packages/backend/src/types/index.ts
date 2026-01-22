// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// User types
export interface CreateUserDTO {
  email: string
  username: string
  password: string
}

export interface LoginDTO {
  email: string
  password: string
}

// Project types
export interface CreateProjectDTO {
  name: string
  description?: string
}

export interface UpdateProjectDTO {
  name?: string
  description?: string
}

// TTS types
export interface TTSRequest {
  text: string
  voiceId: string
  speed?: number
  pitch?: number
}

// NLP types
export interface CharacterRecognitionRequest {
  text: string
}

export interface CharacterRecognitionResponse {
  characters: Array<{
    name: string
    gender: 'male' | 'female' | 'unknown'
    dialogueCount: number
  }>
}
