import type { Job } from 'bull'
import { audioGenerationService } from '../tts/audio-generation.service.js'
import { logger } from '../../utils/logger.js'
import type { AudioGenerationJobData, JobResult } from '../../types/queue.js'
import { socketService } from '../websocket/socket.service.js'
import { prisma } from '../../utils/prisma.js'

/**
 * 音频生成任务处理器
 */
export async function processAudioGeneration(
  job: Job<AudioGenerationJobData>
): Promise<JobResult> {
  const { chapterId, userId } = job.data

  logger.info(
    `Processing audio generation job ${job.id} for chapter ${chapterId}`
  )

  try {
    // 获取章节信息（用于 WebSocket 推送）
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: { projectId: true },
    })

    if (!chapter) {
      throw new Error(`Chapter ${chapterId} not found`)
    }

    const { projectId } = chapter

    // 辅助函数：更新进度并推送 WebSocket 事件
    const updateProgress = async (progress: {
      percentage: number
      message: string
      currentStep: string
      totalSteps: number
    }) => {
      await job.progress(progress)

      // 推送 WebSocket 进度更新
      socketService.emitAudioProgress({
        userId,
        projectId,
        chapterId,
        jobId: job.id.toString(),
        progress,
      })
    }

    // 更新进度：开始处理
    await updateProgress({
      percentage: 10,
      message: '开始生成音频',
      currentStep: '初始化',
      totalSteps: 3,
    })

    // 生成音频
    await updateProgress({
      percentage: 30,
      message: '正在调用 TTS 服务',
      currentStep: '音频合成',
      totalSteps: 3,
    })

    const audio = await audioGenerationService.generateChapterAudio(
      chapterId,
      userId
    )

    // 更新进度：上传完成
    await updateProgress({
      percentage: 90,
      message: '音频已上传到存储',
      currentStep: '完成',
      totalSteps: 3,
    })

    await updateProgress({
      percentage: 100,
      message: '音频生成完成',
      currentStep: '完成',
      totalSteps: 3,
    })

    // 推送完成事件
    socketService.emitAudioComplete({
      userId,
      projectId,
      chapterId,
      jobId: job.id.toString(),
      audioUrl: audio.url,
      duration: audio.duration,
      fileSize: audio.fileSize,
    })

    logger.info(`Audio generation job ${job.id} completed`)

    return {
      success: true,
      data: audio,
    }
  } catch (error: any) {
    logger.error(`Audio generation job ${job.id} failed:`, error)

    // 推送失败事件
    try {
      const chapter = await prisma.chapter.findUnique({
        where: { id: chapterId },
        select: { projectId: true },
      })

      if (chapter) {
        socketService.emitAudioFailed({
          userId,
          projectId: chapter.projectId,
          chapterId,
          jobId: job.id.toString(),
          error: error.message || 'Unknown error',
        })
      }
    } catch (emitError) {
      logger.error('Failed to emit audio failed event:', emitError)
    }

    return {
      success: false,
      error: error.message || 'Unknown error',
    }
  }
}
