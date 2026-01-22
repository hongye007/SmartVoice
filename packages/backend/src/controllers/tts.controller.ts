import type { Response } from 'express'
import type { AuthRequest } from '../middlewares/auth.js'
import { ttsService } from '../services/tts/tts.service.js'
import { audioGenerationService } from '../services/tts/audio-generation.service.js'
import { queueService } from '../services/queue/queue.service.js'
import { TTSProvider } from '../types/tts.js'
import { QueueName } from '../types/queue.js'
import type { AudioGenerationJobData } from '../types/queue.js'
import { prisma } from '../utils/prisma.js'
import { AppError } from '../middlewares/errorHandler.js'

export class TTSController {
  // 获取所有可用音色
  async getVoices(req: AuthRequest, res: Response) {
    const voices = await ttsService.getAllVoices()

    res.json({
      success: true,
      data: voices,
    })
  }

  // 根据提供商获取音色
  async getVoicesByProvider(req: AuthRequest, res: Response) {
    const { provider } = req.params

    const voices = await ttsService.getVoicesByProvider(provider as TTSProvider)

    res.json({
      success: true,
      data: voices,
    })
  }

  // 为章节生成音频
  async generateChapterAudio(req: AuthRequest, res: Response) {
    const { chapterId } = req.params
    const userId = req.userId!

    // 验证章节存在且属于用户
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: { project: true },
    })

    if (!chapter) {
      throw new AppError('Chapter not found', 404)
    }

    if (chapter.project.userId !== userId) {
      throw new AppError('Unauthorized', 403)
    }

    // 添加任务到队列
    const jobData: AudioGenerationJobData = {
      chapterId,
      userId,
      projectId: chapter.projectId,
    }

    const job = await queueService.addJob(QueueName.AUDIO_GENERATION, jobData)

    res.json({
      success: true,
      data: {
        jobId: job.id,
        chapterId,
        status: 'queued',
        message: '音频生成任务已加入队列',
      },
    })
  }

  // 批量生成项目音频
  async generateProjectAudios(req: AuthRequest, res: Response) {
    const { projectId } = req.params
    const userId = req.userId!

    const result = await audioGenerationService.generateProjectAudios(projectId, userId)

    res.json({
      success: true,
      data: result,
      message: `Generated ${result.succeeded.length} audios, ${result.failed.length} failed`,
    })
  }

  // 获取章节音频信息
  async getChapterAudio(req: AuthRequest, res: Response) {
    const { chapterId } = req.params
    const userId = req.userId!

    const audio = await audioGenerationService.getChapterAudio(chapterId, userId)

    res.json({
      success: true,
      data: audio,
    })
  }
}

export const ttsController = new TTSController()
