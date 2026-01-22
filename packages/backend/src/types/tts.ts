// TTS 相关类型定义

// TTS 提供商类型
export enum TTSProvider {
  XFYUN = 'XFYUN', // 讯飞
  BAIDU = 'BAIDU', // 百度
  COQUI = 'COQUI', // Coqui (自托管)
}

// 音色信息
export interface Voice {
  id: string // 音色 ID
  name: string // 音色名称
  gender: 'MALE' | 'FEMALE' | 'CHILD' // 性别
  language: string // 语言 (zh-CN, en-US, etc.)
  description?: string // 描述
  provider: TTSProvider // 提供商
  sampleUrl?: string // 试听链接
}

// TTS 配置参数
export interface TTSConfig {
  voiceId: string // 音色 ID
  speed?: number // 语速 (0.5 - 2.0, 默认 1.0)
  pitch?: number // 音调 (-500 - 500, 默认 0)
  volume?: number // 音量 (0 - 100, 默认 50)
  emotion?: string // 情绪 (neutral, happy, sad, angry, etc.)
  sampleRate?: number // 采样率 (16000, 24000, etc.)
  format?: 'mp3' | 'wav' | 'pcm' // 音频格式
}

// TTS 请求
export interface TTSRequest {
  text: string // 要转换的文本
  config: TTSConfig // TTS 配置
}

// TTS 响应
export interface TTSResponse {
  audioUrl?: string // 音频 URL (如果已上传到存储)
  audioBuffer?: Buffer // 音频数据 (如果还未上传)
  duration?: number // 音频时长（秒）
  fileSize?: number // 文件大小（字节）
  format: string // 音频格式
}

// TTS 适配器接口
export interface TTSAdapter {
  // 获取支持的音色列表
  getVoices(): Promise<Voice[]>

  // 文本转语音
  synthesize(request: TTSRequest): Promise<TTSResponse>

  // 检查服务是否可用
  isAvailable(): Promise<boolean>
}

// 讯飞 TTS 特定配置
export interface XfyunTTSConfig {
  appId: string
  apiKey: string
  apiSecret: string
  apiUrl?: string
}

// 百度 TTS 特定配置
export interface BaiduTTSConfig {
  appId: string
  apiKey: string
  secretKey: string
  apiUrl?: string
}

// 音频生成任务
export interface AudioGenerationTask {
  chapterId: string
  characterId?: string
  text: string
  voiceConfig: TTSConfig
}

// 批量音频生成请求
export interface BatchAudioRequest {
  projectId: string
  chapters: AudioGenerationTask[]
}
