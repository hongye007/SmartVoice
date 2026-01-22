import type { TTSAdapter, TTSRequest, TTSResponse, Voice } from '../../types/tts.js'
import { TTSProvider } from '../../types/tts.js'
import { xfyunTTSAdapter } from './xfyun-tts.adapter.js'
import { coquiTTSAdapter } from './coqui-tts.adapter.js'
import { logger } from '../../utils/logger.js'

/**
 * TTS 服务管理器
 * 管理多个 TTS 提供商，自动选择可用的服务
 */
export class TTSService {
  private adapters: Map<TTSProvider, TTSAdapter>
  private defaultProvider: TTSProvider = TTSProvider.COQUI

  constructor() {
    this.adapters = new Map()

    // 注册 TTS 提供商
    this.adapters.set(TTSProvider.COQUI, coquiTTSAdapter) // 本地部署 Coqui TTS（默认）
    this.adapters.set(TTSProvider.XFYUN, xfyunTTSAdapter) // 讯飞语音合成（云端备选）
    // 后续可以添加更多提供商
    // this.adapters.set(TTSProvider.BAIDU, baiduTTSAdapter)
  }

  /**
   * 获取所有可用音色
   */
  async getAllVoices(): Promise<Voice[]> {
    const allVoices: Voice[] = []

    for (const [provider, adapter] of this.adapters.entries()) {
      try {
        const isAvailable = await adapter.isAvailable()
        if (isAvailable) {
          const voices = await adapter.getVoices()
          allVoices.push(...voices)
        }
      } catch (error) {
        logger.error(`Failed to get voices from ${provider}:`, error)
      }
    }

    return allVoices
  }

  /**
   * 根据提供商获取音色
   */
  async getVoicesByProvider(provider: TTSProvider): Promise<Voice[]> {
    const adapter = this.adapters.get(provider)
    if (!adapter) {
      throw new Error(`TTS provider ${provider} not found`)
    }

    return adapter.getVoices()
  }

  /**
   * 文本转语音
   */
  async synthesize(request: TTSRequest, provider?: TTSProvider): Promise<TTSResponse> {
    const targetProvider = provider || this.defaultProvider
    const adapter = this.adapters.get(targetProvider)

    if (!adapter) {
      throw new Error(`TTS provider ${targetProvider} not found`)
    }

    const isAvailable = await adapter.isAvailable()
    if (!isAvailable) {
      throw new Error(`TTS provider ${targetProvider} is not available or not configured`)
    }

    return adapter.synthesize(request)
  }

  /**
   * 检查指定提供商是否可用
   */
  async isProviderAvailable(provider: TTSProvider): Promise<boolean> {
    const adapter = this.adapters.get(provider)
    if (!adapter) {
      return false
    }

    return adapter.isAvailable()
  }

  /**
   * 获取第一个可用的提供商
   */
  async getFirstAvailableProvider(): Promise<TTSProvider | null> {
    for (const [provider, adapter] of this.adapters.entries()) {
      const isAvailable = await adapter.isAvailable()
      if (isAvailable) {
        return provider
      }
    }

    return null
  }
}

export const ttsService = new TTSService()
