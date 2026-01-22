// 文本解析相关类型定义

// 对话类型
export enum DialogueType {
  CHARACTER = 'CHARACTER', // 角色对话
  NARRATOR = 'NARRATOR', // 旁白
  UNKNOWN = 'UNKNOWN', // 未知类型
}

// 解析的对话片段
export interface ParsedDialogue {
  type: DialogueType
  speaker: string | null // 说话人名称，旁白为 null
  content: string // 对话内容
  lineNumber: number // 行号
  confidence: number // 识别置信度 (0-1)
}

// 解析的章节
export interface ParsedChapter {
  title: string
  content: string
  order: number
  wordCount: number
  dialogues: ParsedDialogue[]
}

// 识别的角色
export interface ExtractedCharacter {
  name: string
  dialogueCount: number
  gender: 'MALE' | 'FEMALE' | 'UNKNOWN'
  sampleDialogues: string[] // 样本对话，用于判断角色特征
}

// 文本解析结果
export interface ParseResult {
  chapters: ParsedChapter[]
  characters: ExtractedCharacter[]
  totalWords: number
  summary: {
    chapterCount: number
    characterCount: number
    dialogueCount: number
  }
}

// 章节分割配置
export interface ChapterSplitOptions {
  patterns: RegExp[] // 章节标题正则表达式
  minWordCount: number // 最小字数阈值
}

// 角色提取配置
export interface CharacterExtractionOptions {
  minDialogueCount: number // 最小对话数阈值
  confidenceThreshold: number // 置信度阈值
}
