import type { Response } from 'express'
import type { AuthRequest } from '../middlewares/auth.js'
import { textParser } from '../services/parser/text-parser.service.js'
import { enhancedTextParser } from '../services/ai/enhanced-parser.service.js'
import { chapterService } from '../services/chapter.service.js'
import { characterService } from '../services/character.service.js'
import { prisma } from '../utils/prisma.js'
import { AppError } from '../middlewares/errorHandler.js'
import { logger } from '../utils/logger.js'

export class ParserController {
  // 解析项目文本
  async parseProject(req: AuthRequest, res: Response) {
    const { projectId } = req.params
    const userId = req.userId!
    const { useAI } = req.body // 是否使用 AI 增强

    // 1. 验证项目所有权
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
    })

    if (!project) {
      throw new AppError('Project not found', 404)
    }

    if (project.status !== 'PENDING') {
      throw new AppError('Project has already been parsed', 400)
    }

    logger.info(`Parsing project ${projectId} for user ${userId} (AI: ${useAI ?? 'auto'})`)

    try {
      // 2. 解析文本（可选 AI 增强）
      const parseResult =
        useAI !== false
          ? await enhancedTextParser.parseFromUrl(project.fileUrl, useAI)
          : await textParser.parseFromUrl(project.fileUrl)

      // 3. 保存章节
      await chapterService.batchCreate(projectId, parseResult.chapters)

      // 4. 保存角色
      await characterService.batchCreate(projectId, parseResult.characters)

      // 5. 更新项目状态
      await prisma.project.update({
        where: { id: projectId },
        data: {
          status: 'READY',
          totalWords: parseResult.totalWords,
        },
      })

      logger.info(`Project ${projectId} parsed successfully`)

      res.json({
        success: true,
        data: {
          summary: parseResult.summary,
          chapters: parseResult.chapters.map((ch) => ({
            title: ch.title,
            order: ch.order,
            wordCount: ch.wordCount,
            dialogueCount: ch.dialogues.length,
          })),
          characters: parseResult.characters.map((char) => ({
            name: char.name,
            dialogueCount: char.dialogueCount,
            gender: char.gender,
          })),
        },
        message: 'Project parsed successfully',
      })
    } catch (error) {
      logger.error(`Failed to parse project ${projectId}:`, error)

      // 更新项目状态为失败
      await prisma.project.update({
        where: { id: projectId },
        data: { status: 'FAILED' },
      })

      throw new AppError('Failed to parse project', 500)
    }
  }

  // 重新解析项目
  async reParseProject(req: AuthRequest, res: Response) {
    const { projectId } = req.params
    const userId = req.userId!

    // 验证项目所有权
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
    })

    if (!project) {
      throw new AppError('Project not found', 404)
    }

    logger.info(`Re-parsing project ${projectId}`)

    try {
      // 1. 删除旧的章节和角色
      await prisma.chapter.deleteMany({ where: { projectId } })
      await prisma.character.deleteMany({ where: { projectId } })

      // 2. 重新解析
      const parseResult = await textParser.parseFromUrl(project.fileUrl)

      // 3. 保存新数据
      await chapterService.batchCreate(projectId, parseResult.chapters)
      await characterService.batchCreate(projectId, parseResult.characters)

      // 4. 更新项目
      await prisma.project.update({
        where: { id: projectId },
        data: {
          status: 'READY',
          totalWords: parseResult.totalWords,
        },
      })

      res.json({
        success: true,
        data: { summary: parseResult.summary },
        message: 'Project re-parsed successfully',
      })
    } catch (error) {
      logger.error(`Failed to re-parse project ${projectId}:`, error)
      throw new AppError('Failed to re-parse project', 500)
    }
  }
}

export const parserController = new ParserController()
