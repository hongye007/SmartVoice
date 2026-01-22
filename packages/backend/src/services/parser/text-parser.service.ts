import axios from 'axios'
import type { ParseResult, ParsedChapter } from '../../types/parser.js'
import { chapterSplitter } from './chapter-splitter.service.js'
import { characterExtractor } from './character-extractor.service.js'
import { logger } from '../../utils/logger.js'

/**
 * 文本解析主服务
 * 整合章节分割和角色识别功能
 */
export class TextParser {
  /**
   * 解析文本文件
   * @param fileUrl 文件 URL（MinIO 或其他存储）
   * @returns 解析结果
   */
  async parseFromUrl(fileUrl: string): Promise<ParseResult> {
    logger.info(`Starting to parse file: ${fileUrl}`)

    // 1. 下载文件内容
    const text = await this.fetchFileContent(fileUrl)

    // 2. 解析文本
    return this.parseText(text)
  }

  /**
   * 直接解析文本内容
   * @param text 文本内容
   * @returns 解析结果
   */
  parseText(text: string): ParseResult {
    logger.info('Parsing text content')

    // 1. 清理文本
    const cleanedText = this.cleanText(text)

    // 2. 分割章节
    const chapters = chapterSplitter.split(cleanedText)

    // 3. 为每个章节提取对话
    const allDialogues = []
    for (const chapter of chapters) {
      const dialogues = characterExtractor.extractDialogues(chapter.content)
      chapter.dialogues = dialogues
      allDialogues.push(...dialogues)
    }

    // 4. 从所有对话中提取角色
    const characters = characterExtractor.extractCharacters(allDialogues)

    // 5. 统计信息
    const totalWords = chapters.reduce((sum, ch) => sum + ch.wordCount, 0)

    const result: ParseResult = {
      chapters,
      characters,
      totalWords,
      summary: {
        chapterCount: chapters.length,
        characterCount: characters.length,
        dialogueCount: allDialogues.length,
      },
    }

    logger.info(
      `Parse complete: ${result.summary.chapterCount} chapters, ${result.summary.characterCount} characters, ${result.summary.dialogueCount} dialogues`
    )

    return result
  }

  /**
   * 从 URL 获取文件内容
   */
  private async fetchFileContent(url: string): Promise<string> {
    try {
      const response = await axios.get(url, {
        responseType: 'text',
        timeout: 30000, // 30秒超时
      })

      if (typeof response.data !== 'string') {
        throw new Error('File content is not text')
      }

      return response.data
    } catch (error) {
      logger.error('Failed to fetch file content:', error)
      throw new Error('Failed to download file for parsing')
    }
  }

  /**
   * 清理文本内容
   */
  private cleanText(text: string): string {
    return (
      text
        // 统一换行符
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        // 移除多余的空行（保留最多一个空行）
        .replace(/\n{3,}/g, '\n\n')
        // 移除行首尾空白
        .split('\n')
        .map((line) => line.trim())
        .join('\n')
        .trim()
    )
  }

  /**
   * 重新解析指定章节
   */
  reParseChapter(chapterContent: string): ParsedChapter {
    const dialogues = characterExtractor.extractDialogues(chapterContent)

    return {
      title: '临时章节',
      content: chapterContent,
      order: 0,
      wordCount: chapterContent.length,
      dialogues,
    }
  }
}

export const textParser = new TextParser()
