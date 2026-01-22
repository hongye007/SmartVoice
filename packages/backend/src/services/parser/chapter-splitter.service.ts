import type { ParsedChapter, ChapterSplitOptions } from '../../types/parser.js'
import { logger } from '../../utils/logger.js'

/**
 * 章节分割服务
 * 负责将文本按章节分割
 */
export class ChapterSplitter {
  // 默认章节标题匹配模式
  private defaultPatterns: RegExp[] = [
    /^第[一二三四五六七八九十百千万\d]+章[\s:：]*.*/i, // 第X章
    /^Chapter\s+\d+[\s:：]*.*/i, // Chapter X
    /^第[一二三四五六七八九十百千万\d]+节[\s:：]*.*/i, // 第X节
    /^Section\s+\d+[\s:：]*.*/i, // Section X
    /^\d+[\s.、]*.*/i, // 数字开头
  ]

  /**
   * 分割章节
   */
  split(text: string, options?: Partial<ChapterSplitOptions>): ParsedChapter[] {
    const patterns = options?.patterns || this.defaultPatterns
    const minWordCount = options?.minWordCount || 50

    // 按行分割文本
    const lines = text.split('\n').map((line) => line.trim())

    // 查找所有章节标题
    const chapterIndices: Array<{ index: number; title: string }> = []

    lines.forEach((line, index) => {
      if (this.isChapterTitle(line, patterns)) {
        chapterIndices.push({ index, title: line })
      }
    })

    // 如果没有找到章节，将整个文本作为一个章节
    if (chapterIndices.length === 0) {
      logger.warn('No chapter titles found, treating entire text as one chapter')
      return [
        {
          title: '全文',
          content: text,
          order: 1,
          wordCount: this.countWords(text),
          dialogues: [],
        },
      ]
    }

    // 提取章节内容
    const chapters: ParsedChapter[] = []

    for (let i = 0; i < chapterIndices.length; i++) {
      const { index, title } = chapterIndices[i]
      const nextIndex = chapterIndices[i + 1]?.index || lines.length

      // 提取章节内容（跳过标题行）
      const chapterLines = lines.slice(index + 1, nextIndex)
      const content = chapterLines.join('\n').trim()

      const wordCount = this.countWords(content)

      // 跳过太短的章节
      if (wordCount < minWordCount) {
        logger.debug(`Skipping short chapter: ${title} (${wordCount} words)`)
        continue
      }

      chapters.push({
        title,
        content,
        order: chapters.length + 1,
        wordCount,
        dialogues: [],
      })
    }

    logger.info(`Split text into ${chapters.length} chapters`)
    return chapters
  }

  /**
   * 判断是否为章节标题
   */
  private isChapterTitle(line: string, patterns: RegExp[]): boolean {
    if (!line || line.length === 0) return false
    if (line.length > 100) return false // 标题通常不会太长

    return patterns.some((pattern) => pattern.test(line))
  }

  /**
   * 统计字数（中文按字符，英文按单词）
   */
  private countWords(text: string): number {
    // 移除标点和空白
    const cleanText = text.replace(/[\s\p{P}]/gu, '')

    // 统计中文字符
    const chineseChars = cleanText.match(/[\u4e00-\u9fa5]/g)
    const chineseCount = chineseChars ? chineseChars.length : 0

    // 统计英文单词
    const englishWords = text.match(/[a-zA-Z]+/g)
    const englishCount = englishWords ? englishWords.length : 0

    return chineseCount + englishCount
  }
}

export const chapterSplitter = new ChapterSplitter()
