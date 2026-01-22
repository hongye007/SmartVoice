import { v4 as uuidv4 } from 'uuid'
import type { TTSConfig } from '../../types/tts.js'
import { ttsService } from './tts.service.js'
import { storageService } from '../storage/storage.service.js'
import { prisma } from '../../utils/prisma.js'
import { logger } from '../../utils/logger.js'
import { AppError } from '../../middlewares/errorHandler.js'

/**
 * 音频生成服务
 * 负责将文本转换为音频并存储
 */
export class AudioGenerationService {
  /**
   * 为章节生成音频
   * @param chapterId 章节 ID
   * @param userId 用户 ID
   */
  async generateChapterAudio(chapterId: string, userId: string) {
    logger.info(`Starting audio generation for chapter ${chapterId}`)

    // 1. 获取章节信息
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        project: {
          include: {
            characters: true,
          },
        },
      },
    })

    if (!chapter) {
      throw new AppError('Chapter not found', 404)
    }

    if (chapter.project.userId !== userId) {
      throw new AppError('Unauthorized', 403)
    }

    // 2. 检查是否已有音频
    const existingAudio = await prisma.audio.findFirst({
      where: { chapterId, status: { in: ['COMPLETED', 'PROCESSING'] } },
    })

    if (existingAudio) {
      throw new AppError('Audio already exists or is being generated', 400)
    }

    // 3. 创建音频记录
    const audio = await prisma.audio.create({
      data: {
        projectId: chapter.projectId,
        chapterId,
        url: '', // Will be updated after generation
        status: 'PROCESSING',
      },
    })

    try {
      // 4. 生成音频
      const ttsConfig: TTSConfig = {
        voiceId: 'xiaoyan', // 默认音色，后续可以根据角色分配
        speed: 1.0,
        volume: 50,
        pitch: 50,
        format: 'mp3',
      }

      const ttsResponse = await ttsService.synthesize({
        text: chapter.content,
        config: ttsConfig,
      })

      // 5. 上传到 MinIO
      if (!ttsResponse.audioBuffer) {
        throw new Error('No audio buffer returned from TTS')
      }

      const filename = `audios/${uuidv4()}.mp3`
      const audioUrl = await storageService.uploadFile({
        buffer: ttsResponse.audioBuffer,
        originalname: filename,
        mimetype: 'audio/mpeg',
        folder: 'audios',
      })

      // 6. 计算音频时长（简单估算：中文 1 字约 0.5 秒）
      const estimatedDuration = Math.ceil(chapter.wordCount * 0.5)

      // 7. 更新音频记录
      const updatedAudio = await prisma.audio.update({
        where: { id: audio.id },
        data: {
          url: storageService.getFileUrl(audioUrl),
          duration: estimatedDuration,
          fileSize: ttsResponse.fileSize || ttsResponse.audioBuffer.length,
          status: 'COMPLETED',
        },
      })

      // 8. 更新章节状态为已完成
      await prisma.chapter.update({
        where: { id: chapterId },
        data: { status: 'COMPLETED' },
      })

      // 9. 检查项目所有章节是否都已完成
      const allChapters = await prisma.chapter.findMany({
        where: { projectId: chapter.projectId },
        select: { status: true },
      })

      const allCompleted = allChapters.every(ch => ch.status === 'COMPLETED')

      // 10. 只有所有章节都完成时，才更新项目状态为 COMPLETED
      if (allCompleted) {
        await prisma.project.update({
          where: { id: chapter.projectId },
          data: { status: 'COMPLETED' },
        })
        logger.info(`All chapters completed, project ${chapter.projectId} marked as COMPLETED`)
      } else {
        // 至少有一个章节在生成，保持 GENERATING 状态
        await prisma.project.update({
          where: { id: chapter.projectId },
          data: { status: 'GENERATING' },
        })
      }

      logger.info(`Audio generation completed for chapter ${chapterId}`)

      return updatedAudio
    } catch (error) {
      // 更新为失败状态
      await prisma.audio.update({
        where: { id: audio.id },
        data: {
          status: 'FAILED',
          errorMsg: error instanceof Error ? error.message : 'Unknown error',
        },
      })

      logger.error(`Audio generation failed for chapter ${chapterId}:`, error)
      throw error
    }
  }

  /**
   * 批量生成项目的所有章节音频
   * @param projectId 项目 ID
   * @param userId 用户 ID
   */
  async generateProjectAudios(projectId: string, userId: string) {
    logger.info(`Starting batch audio generation for project ${projectId}`)

    // 1. 验证项目所有权
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
      include: { chapters: true },
    })

    if (!project) {
      throw new AppError('Project not found', 404)
    }

    if (project.status !== 'READY') {
      throw new AppError('Project must be in READY status to generate audio', 400)
    }

    // 2. 更新项目状态为生成中
    await prisma.project.update({
      where: { id: projectId },
      data: { status: 'GENERATING' },
    })

    const results = []
    const errors = []

    // 3. 为每个章节生成音频
    for (const chapter of project.chapters) {
      try {
        const audio = await this.generateChapterAudio(chapter.id, userId)
        results.push(audio)
      } catch (error) {
        logger.error(`Failed to generate audio for chapter ${chapter.id}:`, error)
        errors.push({
          chapterId: chapter.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    // 4. 更新项目状态
    const finalStatus = errors.length === 0 ? 'COMPLETED' : 'FAILED'
    await prisma.project.update({
      where: { id: projectId },
      data: { status: finalStatus },
    })

    logger.info(
      `Batch audio generation completed for project ${projectId}: ${results.length} succeeded, ${errors.length} failed`
    )

    return {
      succeeded: results,
      failed: errors,
    }
  }

  /**
   * 获取章节音频
   */
  async getChapterAudio(chapterId: string, userId: string) {
    const audio = await prisma.audio.findFirst({
      where: { chapterId },
      include: {
        project: {
          select: { userId: true },
        },
      },
    })

    if (!audio) {
      throw new AppError('Audio not found', 404)
    }

    if (audio.project.userId !== userId) {
      throw new AppError('Unauthorized', 403)
    }

    return audio
  }
}

export const audioGenerationService = new AudioGenerationService()
