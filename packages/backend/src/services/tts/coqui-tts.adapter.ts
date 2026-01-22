import axios from 'axios'
import type {
  TTSAdapter,
  TTSRequest,
  TTSResponse,
  Voice,
} from '../../types/tts.js'
import { TTSProvider } from '../../types/tts.js'
import { config } from '../../config/index.js'
import { logger } from '../../utils/logger.js'

/**
 * Coqui TTS 适配器 (本地部署)
 * 文档: https://github.com/coqui-ai/TTS
 */
export class CoquiTTSAdapter implements TTSAdapter {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '') // 移除末尾斜杠
  }

  /**
   * 获取支持的音色列表
   * Coqui TTS 支持多种预训练模型和音色
   */
  async getVoices(): Promise<Voice[]> {
    try {
      // 尝试从服务端获取音色列表
      const response = await axios.get(`${this.baseUrl}/api/speakers`, {
        timeout: 5000,
      })

      if (response.data && Array.isArray(response.data)) {
        return response.data.map((speaker: any, index: number) => ({
          id: speaker.id || speaker.name || `speaker_${index}`,
          name: speaker.name || `音色 ${index + 1}`,
          gender: this.inferGender(speaker.name),
          language: 'zh-CN',
          description: speaker.description || '',
          provider: TTSProvider.COQUI,
        }))
      }
    } catch (error) {
      logger.debug('Coqui TTS: Unable to fetch speakers from API, using defaults')
    }

    // 如果 API 不支持获取音色列表，返回默认音色
    return this.getDefaultVoices()
  }

  /**
   * 获取默认音色列表
   */
  private getDefaultVoices(): Voice[] {
    return [
      {
        id: 'tts_models/zh-CN/baker/tacotron2-DDC',
        name: '中文女声',
        gender: 'FEMALE',
        language: 'zh-CN',
        description: 'Coqui 中文女声模型',
        provider: TTSProvider.COQUI,
      },
      {
        id: 'tts_models/zh-CN/baker/tacotron2',
        name: '中文标准音',
        gender: 'FEMALE',
        language: 'zh-CN',
        description: 'Coqui 中文标准音模型',
        provider: TTSProvider.COQUI,
      },
    ]
  }

  /**
   * 推断性别（基于音色名称）
   */
  private inferGender(name?: string): 'MALE' | 'FEMALE' | 'CHILD' {
    if (!name) return 'FEMALE'

    const nameLower = name.toLowerCase()
    if (nameLower.includes('male') || nameLower.includes('男')) return 'MALE'
    if (nameLower.includes('child') || nameLower.includes('童') || nameLower.includes('小孩')) return 'CHILD'
    return 'FEMALE'
  }

  /**
   * 文本转语音
   */
  async synthesize(request: TTSRequest): Promise<TTSResponse> {
    const { text, config } = request

    if (!await this.isAvailable()) {
      throw new Error('Coqui TTS service is not available')
    }

    logger.info(`Coqui TTS: Synthesizing text (${text.length} chars)`)

    try {
      // Coqui TTS Server API 使用 GET 请求
      // 注意：当前使用的中文模型是单音色模型，不需要 speaker_id
      const params = new URLSearchParams({
        text: text,
      })

      const response = await axios.get(
        `${this.baseUrl}/api/tts?${params.toString()}`,
        {
          responseType: 'arraybuffer',
          timeout: 300000, // 5分钟超时（Coqui TTS 在 CPU 模式下较慢）
        }
      )

      const audioBuffer = Buffer.from(response.data)
      logger.info(`Coqui TTS: Generated audio (${audioBuffer.length} bytes)`)

      return {
        audioBuffer,
        format: 'wav', // Coqui TTS 默认返回 WAV 格式
        fileSize: audioBuffer.length,
      }
    } catch (error: any) {
      logger.error('Coqui TTS synthesis error:', error.message)

      if (error.code === 'ECONNREFUSED') {
        throw new Error('无法连接到 Coqui TTS 服务，请确保服务已启动')
      }

      if (error.response) {
        const errorDetail = error.response.data ? Buffer.from(error.response.data).toString('utf-8').substring(0, 200) : ''
        logger.error('Coqui TTS error details:', errorDetail)
        throw new Error(`Coqui TTS 错误: ${error.response.status} - ${error.response.statusText}`)
      }

      throw new Error(`Coqui TTS 合成失败: ${error.message}`)
    }
  }

  /**
   * 检查服务是否可用
   */
  async isAvailable(): Promise<boolean> {
    try {
      // 尝试连接健康检查端点
      const response = await axios.get(`${this.baseUrl}/`, {
        timeout: 3000,
      })

      return response.status === 200
    } catch (error) {
      // 尝试备用端点
      try {
        const response = await axios.get(`${this.baseUrl}/api/tts`, {
          timeout: 3000,
        })
        return response.status === 200 || response.status === 400 // 400 表示缺少参数，但服务可用
      } catch {
        logger.debug('Coqui TTS service is not available')
        return false
      }
    }
  }
}

// 导出单例
export const coquiTTSAdapter = new CoquiTTSAdapter(config.coquiTTS.url)
