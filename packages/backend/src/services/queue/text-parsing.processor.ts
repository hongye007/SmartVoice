import type { Job } from 'bull'
import { textParser } from '../parser/text-parser.service.js'
import { enhancedTextParser } from '../ai/enhanced-parser.service.js'
import { chapterService } from '../chapter.service.js'
import { characterService } from '../character.service.js'
import { prisma } from '../../utils/prisma.js'
import { logger } from '../../utils/logger.js'
import type { TextParsingJobData, JobResult } from '../../types/queue.js'

/**
 * 文本解析任务处理器
 */
export async function processTextParsing(
  job: Job<TextParsingJobData>
): Promise<JobResult> {
  const { projectId, userId, useAI } = job.data

  logger.info(
    `Processing text parsing job ${job.id} for project ${projectId} (AI: ${useAI ?? 'auto'})`
  )

  try {
    // 1. 获取项目信息
    await job.progress({
      percentage: 5,
      message: '获取项目信息',
      currentStep: '初始化',
      totalSteps: 5,
    })

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
    })

    if (!project) {
      throw new Error('Project not found')
    }

    // 2. 解析文本
    await job.progress({
      percentage: 20,
      message: '开始解析文本',
      currentStep: '文本解析',
      totalSteps: 5,
    })

    const parseResult =
      useAI !== false
        ? await enhancedTextParser.parseFromUrl(project.fileUrl, useAI)
        : await textParser.parseFromUrl(project.fileUrl)

    // 3. 保存章节
    await job.progress({
      percentage: 50,
      message: `保存 ${parseResult.chapters.length} 个章节`,
      currentStep: '保存章节',
      totalSteps: 5,
    })

    await chapterService.batchCreate(projectId, parseResult.chapters)

    // 4. 保存角色
    await job.progress({
      percentage: 70,
      message: `保存 ${parseResult.characters.length} 个角色`,
      currentStep: '保存角色',
      totalSteps: 5,
    })

    await characterService.batchCreate(projectId, parseResult.characters)

    // 5. 更新项目状态
    await job.progress({
      percentage: 90,
      message: '更新项目状态',
      currentStep: '完成',
      totalSteps: 5,
    })

    await prisma.project.update({
      where: { id: projectId },
      data: {
        status: 'READY',
        totalWords: parseResult.totalWords,
      },
    })

    await job.progress({
      percentage: 100,
      message: '文本解析完成',
    })

    logger.info(`Text parsing job ${job.id} completed`)

    return {
      success: true,
      data: {
        summary: parseResult.summary,
        chapters: parseResult.chapters.length,
        characters: parseResult.characters.length,
      },
    }
  } catch (error: any) {
    logger.error(`Text parsing job ${job.id} failed:`, error)

    // 更新项目状态为失败
    await prisma.project.update({
      where: { id: projectId },
      data: { status: 'FAILED' },
    })

    return {
      success: false,
      error: error.message || 'Unknown error',
    }
  }
}
