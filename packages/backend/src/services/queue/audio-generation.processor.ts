import type { Job } from 'bull'
import { audioGenerationService } from '../tts/audio-generation.service.js'
import { logger } from '../../utils/logger.js'
import type { AudioGenerationJobData, JobResult } from '../../types/queue.js'

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
    // 更新进度：开始处理
    await job.progress({
      percentage: 10,
      message: '开始生成音频',
      currentStep: '初始化',
      totalSteps: 3,
    })

    // 生成音频
    await job.progress({
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
    await job.progress({
      percentage: 90,
      message: '音频已上传到存储',
      currentStep: '完成',
      totalSteps: 3,
    })

    await job.progress({
      percentage: 100,
      message: '音频生成完成',
    })

    logger.info(`Audio generation job ${job.id} completed`)

    return {
      success: true,
      data: audio,
    }
  } catch (error: any) {
    logger.error(`Audio generation job ${job.id} failed:`, error)
    return {
      success: false,
      error: error.message || 'Unknown error',
    }
  }
}
