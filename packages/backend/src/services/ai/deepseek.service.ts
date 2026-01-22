import axios from 'axios'
import { config } from '../../config/index.js'
import { logger } from '../../utils/logger.js'

/**
 * DeepSeek AI 服务
 * 用于增强文本解析能力
 */
export class DeepSeekService {
  private apiKey: string
  private apiUrl: string

  constructor() {
    this.apiKey = config.deepseek.apiKey
    this.apiUrl = config.deepseek.apiUrl
  }

  /**
   * 使用 AI 增强角色识别
   * 从对话中提取角色名称和特征
   */
  async extractCharactersFromText(text: string): Promise<{
    characters: Array<{
      name: string
      gender: 'MALE' | 'FEMALE' | 'UNKNOWN'
      traits: string[]
    }>
  }> {
    if (!this.apiKey || this.apiKey === 'your-deepseek-api-key') {
      logger.warn('DeepSeek API key not configured, skipping AI enhancement')
      return { characters: [] }
    }

    try {
      const prompt = `请分析以下小说文本，提取所有出现的角色名称，并判断他们的性别。

文本：
${text.slice(0, 2000)} // 限制文本长度以节省成本

请以 JSON 格式返回结果，格式如下：
{
  "characters": [
    {
      "name": "张三",
      "gender": "MALE",
      "traits": ["主角", "勇敢"]
    }
  ]
}

注意：
1. gender 只能是 MALE、FEMALE 或 UNKNOWN
2. 只返回明确提到的角色
3. 忽略"他"、"她"等代词
4. traits 是可选的角色特征`

      const response = await axios.post(
        `${this.apiUrl}/v1/chat/completions`,
        {
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: '你是一个专业的文学分析助手，擅长从小说文本中提取角色信息。',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3, // 较低的温度保证结果稳定
          max_tokens: 1000,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          timeout: 30000,
        }
      )

      const content = response.data.choices[0]?.message?.content
      if (!content) {
        throw new Error('Empty response from DeepSeek API')
      }

      // 尝试解析 JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0])
        logger.info(`DeepSeek AI extracted ${result.characters?.length || 0} characters`)
        return result
      }

      return { characters: [] }
    } catch (error: any) {
      logger.error('DeepSeek API error:', error.response?.data || error.message)
      return { characters: [] }
    }
  }

  /**
   * 使用 AI 改进对话分割
   * 识别对话边界和说话人
   */
  async enhanceDialogueExtraction(text: string): Promise<{
    dialogues: Array<{
      speaker: string
      content: string
      emotion?: string
    }>
  }> {
    if (!this.apiKey || this.apiKey === 'your-deepseek-api-key') {
      return { dialogues: [] }
    }

    try {
      const prompt = `请从以下文本中提取所有对话，并识别说话人。

文本：
${text.slice(0, 1500)}

请以 JSON 格式返回，格式如下：
{
  "dialogues": [
    {
      "speaker": "张三",
      "content": "你好！",
      "emotion": "友好"
    }
  ]
}

注意：
1. speaker 必须是具体的角色名称，不能是"旁白"或代词
2. content 是对话内容，不包含引号
3. emotion 是可选的情绪标注`

      const response = await axios.post(
        `${this.apiUrl}/v1/chat/completions`,
        {
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: '你是一个专业的对话分析助手。',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3,
          max_tokens: 1500,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          timeout: 30000,
        }
      )

      const content = response.data.choices[0]?.message?.content
      if (!content) {
        throw new Error('Empty response from DeepSeek API')
      }

      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0])
        logger.info(`DeepSeek AI extracted ${result.dialogues?.length || 0} dialogues`)
        return result
      }

      return { dialogues: [] }
    } catch (error: any) {
      logger.error('DeepSeek dialogue extraction error:', error.response?.data || error.message)
      return { dialogues: [] }
    }
  }
}

export const deepseekService = new DeepSeekService()
