import type {
  ParsedDialogue,
  ExtractedCharacter,
  CharacterExtractionOptions,
} from '../../types/parser.js'
import { DialogueType } from '../../types/parser.js'
import { logger } from '../../utils/logger.js'

/**
 * 角色提取服务
 * 负责从文本中识别对话和提取角色
 */
export class CharacterExtractor {
  // 对话模式：引号、冒号等
  private dialoguePatterns = [
    // "张三说："你好！""
    {
      pattern: /([^""]+)(说|道|问|答|叫|喊|笑|哭|怒|骂)[:：]?[""]([^""]+)[""]/g,
      speakerIndex: 1,
      contentIndex: 3,
    },
    // ""你好！"张三说。"
    {
      pattern: /[""]([^""]+)[""][\s,，]*([^""说道问答叫喊笑哭怒骂]+)(说|道|问|答|叫|喊|笑|哭|怒|骂)/g,
      speakerIndex: 2,
      contentIndex: 1,
    },
    // "张三：你好！"
    {
      pattern: /([^:：""]+)[:：][""]([^""]+)[""]/g,
      speakerIndex: 1,
      contentIndex: 2,
    },
  ]

  // 旁白关键词
  private narratorKeywords = [
    '旁白',
    '叙述',
    '描述',
    '此时',
    '这时',
    '突然',
    '只见',
    '原来',
  ]

  /**
   * 从文本中提取对话
   */
  extractDialogues(text: string): ParsedDialogue[] {
    const dialogues: ParsedDialogue[] = []
    const lines = text.split('\n')

    lines.forEach((line, lineIndex) => {
      const trimmedLine = line.trim()
      if (!trimmedLine) return

      // 尝试匹配对话模式
      let matched = false

      for (const { pattern, speakerIndex, contentIndex } of this.dialoguePatterns) {
        const regex = new RegExp(pattern)
        const matches = [...trimmedLine.matchAll(regex)]

        if (matches.length > 0) {
          matches.forEach((match) => {
            const speaker = match[speakerIndex]?.trim()
            const content = match[contentIndex]?.trim()

            if (speaker && content) {
              dialogues.push({
                type: DialogueType.CHARACTER,
                speaker: this.cleanSpeakerName(speaker),
                content,
                lineNumber: lineIndex + 1,
                confidence: 0.9,
              })
            }
          })
          matched = true
          break
        }
      }

      // 如果没有匹配到对话，检查是否为旁白
      if (!matched && this.isNarrator(trimmedLine)) {
        dialogues.push({
          type: DialogueType.NARRATOR,
          speaker: null,
          content: trimmedLine,
          lineNumber: lineIndex + 1,
          confidence: 0.8,
        })
      }
    })

    logger.info(`Extracted ${dialogues.length} dialogues`)
    return dialogues
  }

  /**
   * 从对话中提取角色
   */
  extractCharacters(
    dialogues: ParsedDialogue[],
    options?: Partial<CharacterExtractionOptions>
  ): ExtractedCharacter[] {
    const minDialogueCount = options?.minDialogueCount || 2
    const confidenceThreshold = options?.confidenceThreshold || 0.7

    // 按说话人分组统计
    const characterMap = new Map<
      string,
      {
        dialogues: ParsedDialogue[]
        sampleDialogues: string[]
      }
    >()

    dialogues.forEach((dialogue) => {
      if (
        dialogue.type === DialogueType.CHARACTER &&
        dialogue.speaker &&
        dialogue.confidence >= confidenceThreshold
      ) {
        const speaker = dialogue.speaker

        if (!characterMap.has(speaker)) {
          characterMap.set(speaker, {
            dialogues: [],
            sampleDialogues: [],
          })
        }

        const charData = characterMap.get(speaker)!
        charData.dialogues.push(dialogue)

        // 保留前3条样本对话
        if (charData.sampleDialogues.length < 3) {
          charData.sampleDialogues.push(dialogue.content)
        }
      }
    })

    // 筛选并构建角色列表
    const characters: ExtractedCharacter[] = []

    characterMap.forEach((data, name) => {
      if (data.dialogues.length >= minDialogueCount) {
        characters.push({
          name,
          dialogueCount: data.dialogues.length,
          gender: this.inferGender(name, data.sampleDialogues),
          sampleDialogues: data.sampleDialogues,
        })
      }
    })

    // 按对话数量排序
    characters.sort((a, b) => b.dialogueCount - a.dialogueCount)

    logger.info(`Extracted ${characters.length} characters`)
    return characters
  }

  /**
   * 清理说话人名称
   */
  private cleanSpeakerName(speaker: string): string {
    return (
      speaker
        .replace(/["""'']/g, '')
        // 移除常见后缀
        .replace(/(先生|女士|小姐|老师|同学|师傅|大人|陛下|殿下|阁下)$/g, '')
        .trim()
    )
  }

  /**
   * 判断是否为旁白
   */
  private isNarrator(text: string): boolean {
    // 检查是否包含旁白关键词
    if (this.narratorKeywords.some((keyword) => text.includes(keyword))) {
      return true
    }

    // 检查是否为纯描述性文字（不含对话引号）
    if (!text.includes('"') && !text.includes('"') && text.length > 20) {
      return true
    }

    return false
  }

  /**
   * 推断角色性别（基于名字和对话内容的简单规则）
   */
  private inferGender(
    name: string,
    sampleDialogues: string[]
  ): 'MALE' | 'FEMALE' | 'UNKNOWN' {
    // 女性名字常见字
    const femaleChars = ['妹', '姐', '婆', '娘', '嫂', '姑', '姨', '妃', '女', '花', '雪', '月', '凤']

    // 男性名字常见字
    const maleChars = ['哥', '弟', '爷', '公', '叔', '伯', '舅', '郎', '汉', '夫', '侠', '雄', '龙', '虎']

    // 检查名字
    if (femaleChars.some((char) => name.includes(char))) {
      return 'FEMALE'
    }

    if (maleChars.some((char) => name.includes(char))) {
      return 'MALE'
    }

    // TODO: 可以基于对话内容进一步判断（如使用第一人称代词等）

    return 'UNKNOWN'
  }
}

export const characterExtractor = new CharacterExtractor()
