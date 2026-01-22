import type { ParseResult } from '../../types/parser.js'
import { textParser } from '../parser/text-parser.service.js'
import { deepseekService } from '../ai/deepseek.service.js'
import { characterExtractor } from '../parser/character-extractor.service.js'
import { logger } from '../../utils/logger.js'

/**
 * AI 增强的文本解析服务
 * 在规则解析的基础上使用 AI 提升准确率
 */
export class EnhancedTextParser {
  /**
   * 解析文本（带 AI 增强）
   * @param fileUrl 文件 URL
   * @param useAI 是否使用 AI 增强（默认 true）
   * @returns 解析结果
   */
  async parseFromUrl(fileUrl: string, useAI: boolean = true): Promise<ParseResult> {
    logger.info(`Starting enhanced parsing for: ${fileUrl}`)

    // 1. 先用规则解析
    const baseResult = await textParser.parseFromUrl(fileUrl)

    // 2. 如果不使用 AI 或角色数量足够，直接返回
    if (!useAI || baseResult.characters.length >= 3) {
      logger.info('Rule-based parsing sufficient, skipping AI enhancement')
      return baseResult
    }

    // 3. 使用 AI 增强角色识别
    logger.info('Characters count low, using AI enhancement')

    try {
      // 获取前几章的文本内容
      const sampleText = baseResult.chapters
        .slice(0, 3) // 取前3章
        .map((ch) => ch.content)
        .join('\n\n')

      // AI 提取角色
      const aiResult = await deepseekService.extractCharactersFromText(sampleText)

      if (aiResult.characters && aiResult.characters.length > 0) {
        // 合并 AI 识别的角色和规则识别的角色
        const existingNames = new Set(baseResult.characters.map((c) => c.name))

        aiResult.characters.forEach((aiChar) => {
          if (!existingNames.has(aiChar.name)) {
            baseResult.characters.push({
              name: aiChar.name,
              gender: aiChar.gender,
              dialogueCount: 0, // AI 识别的角色暂时没有对话统计
              sampleDialogues: [],
            })
          }
        })

        logger.info(
          `AI enhancement added ${aiResult.characters.length} characters, total: ${baseResult.characters.length}`
        )
      }

      // 更新摘要
      baseResult.summary.characterCount = baseResult.characters.length

      return baseResult
    } catch (error) {
      logger.error('AI enhancement failed, using base result:', error)
      return baseResult
    }
  }

  /**
   * 仅提取对话（带 AI 增强）
   */
  async extractDialoguesWithAI(text: string) {
    // 1. 规则提取
    const ruleDialogues = characterExtractor.extractDialogues(text)

    // 2. AI 增强
    try {
      const aiResult = await deepseekService.enhanceDialogueExtraction(text)

      if (aiResult.dialogues && aiResult.dialogues.length > ruleDialogues.length) {
        logger.info(
          `AI found ${aiResult.dialogues.length} dialogues vs ${ruleDialogues.length} from rules`
        )
        // 可以在这里合并或选择更好的结果
      }

      return ruleDialogues
    } catch (error) {
      logger.error('AI dialogue extraction failed:', error)
      return ruleDialogues
    }
  }
}

export const enhancedTextParser = new EnhancedTextParser()
