import WebSocket from 'ws'
import crypto from 'crypto'
import { URL } from 'url'
import type {
  TTSAdapter,
  TTSRequest,
  TTSResponse,
  Voice,
  XfyunTTSConfig,
} from '../../types/tts.js'
import { TTSProvider } from '../../types/tts.js'
import { config } from '../../config/index.js'
import { logger } from '../../utils/logger.js'

/**
 * 讯飞语音合成适配器
 * 文档: https://www.xfyun.cn/doc/tts/online_tts/API.html
 */
export class XfyunTTSAdapter implements TTSAdapter {
  private appId: string
  private apiKey: string
  private apiSecret: string
  private apiUrl: string

  constructor(config: XfyunTTSConfig) {
    this.appId = config.appId
    this.apiKey = config.apiKey
    this.apiSecret = config.apiSecret
    this.apiUrl = config.apiUrl || 'wss://tts-api.xfyun.cn/v2/tts'
  }

  /**
   * 获取支持的音色列表
   */
  async getVoices(): Promise<Voice[]> {
    // 讯飞常用音色列表
    return [
      {
        id: 'xiaoyan',
        name: '小燕',
        gender: 'FEMALE',
        language: 'zh-CN',
        description: '亲切女声',
        provider: TTSProvider.XFYUN,
      },
      {
        id: 'aisjiuxu',
        name: '许久',
        gender: 'MALE',
        language: 'zh-CN',
        description: '温柔男声',
        provider: TTSProvider.XFYUN,
      },
      {
        id: 'aisxping',
        name: '小萍',
        gender: 'FEMALE',
        language: 'zh-CN',
        description: '知性女声',
        provider: TTSProvider.XFYUN,
      },
      {
        id: 'aisjinger',
        name: '小婧',
        gender: 'FEMALE',
        language: 'zh-CN',
        description: '柔美女声',
        provider: TTSProvider.XFYUN,
      },
      {
        id: 'aisbabyxu',
        name: '许小宝',
        gender: 'CHILD',
        language: 'zh-CN',
        description: '可爱童声',
        provider: TTSProvider.XFYUN,
      },
    ]
  }

  /**
   * 文本转语音
   */
  async synthesize(request: TTSRequest): Promise<TTSResponse> {
    const { text, config } = request

    if (!this.isConfigured()) {
      throw new Error('Xfyun TTS not configured')
    }

    logger.info(`Xfyun TTS: Synthesizing text (${text.length} chars) with voice ${config.voiceId}`)

    return new Promise((resolve, reject) => {
      const authUrl = this.generateAuthUrl()
      const ws = new WebSocket(authUrl)

      const audioChunks: Buffer[] = []
      let hasError = false

      ws.on('open', () => {
        const params = {
          common: {
            app_id: this.appId,
          },
          business: {
            aue: 'lame', // mp3 格式
            auf: 'audio/L16;rate=16000', // 采样率
            vcn: config.voiceId || 'xiaoyan', // 发音人
            speed: Math.round((config.speed || 1.0) * 50), // 语速 (0-100)
            volume: config.volume || 50, // 音量 (0-100)
            pitch: config.pitch || 50, // 音调 (0-100)
            tte: 'UTF8', // 文本编码
          },
          data: {
            status: 2, // 数据状态,固定为2
            text: Buffer.from(text).toString('base64'), // 文本 Base64 编码
          },
        }

        ws.send(JSON.stringify(params))
      })

      ws.on('message', (data: WebSocket.Data) => {
        try {
          const response = JSON.parse(data.toString())

          if (response.code !== 0) {
            hasError = true
            ws.close()
            return reject(new Error(`Xfyun TTS error: ${response.message} (code: ${response.code})`))
          }

          // 接收音频数据
          if (response.data && response.data.audio) {
            const audioBuffer = Buffer.from(response.data.audio, 'base64')
            audioChunks.push(audioBuffer)
          }

          // 合成完成
          if (response.data && response.data.status === 2) {
            ws.close()
          }
        } catch (error) {
          hasError = true
          ws.close()
          reject(error)
        }
      })

      ws.on('close', () => {
        if (!hasError) {
          const audioBuffer = Buffer.concat(audioChunks)
          logger.info(`Xfyun TTS: Generated audio (${audioBuffer.length} bytes)`)

          resolve({
            audioBuffer,
            format: 'mp3',
            fileSize: audioBuffer.length,
          })
        }
      })

      ws.on('error', (error) => {
        hasError = true
        logger.error('Xfyun TTS WebSocket error:', error)
        reject(error)
      })

      // 超时处理
      setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close()
          reject(new Error('Xfyun TTS timeout'))
        }
      }, 60000) // 60秒超时
    })
  }

  /**
   * 检查服务是否可用
   */
  async isAvailable(): Promise<boolean> {
    return this.isConfigured()
  }

  /**
   * 检查是否已配置
   */
  private isConfigured(): boolean {
    return !!(this.appId && this.apiKey && this.apiSecret)
  }

  /**
   * 生成鉴权 URL
   */
  private generateAuthUrl(): string {
    const url = new URL(this.apiUrl)
    const host = url.host
    const path = url.pathname

    // RFC1123 格式的时间戳
    const date = new Date().toUTCString()

    // 生成签名
    const signatureOrigin = `host: ${host}\ndate: ${date}\nGET ${path} HTTP/1.1`
    const signature = crypto
      .createHmac('sha256', this.apiSecret)
      .update(signatureOrigin)
      .digest('base64')

    // 生成鉴权参数
    const authorizationOrigin = `api_key="${this.apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`
    const authorization = Buffer.from(authorizationOrigin).toString('base64')

    // 拼接鉴权 URL
    return `${this.apiUrl}?authorization=${authorization}&date=${encodeURIComponent(date)}&host=${host}`
  }
}

// 导出单例
export const xfyunTTSAdapter = new XfyunTTSAdapter({
  appId: config.xfyunTTS.appId,
  apiKey: config.xfyunTTS.apiKey,
  apiSecret: config.xfyunTTS.apiSecret,
  apiUrl: config.xfyunTTS.apiUrl,
})
