import { queueService } from './queue.service.js'
import { processAudioGeneration } from './audio-generation.processor.js'
import { processTextParsing } from './text-parsing.processor.js'
import { QueueName } from '../../types/queue.js'
import { logger } from '../../utils/logger.js'

/**
 * 初始化所有队列处理器
 */
export function initializeQueues() {
  logger.info('Initializing queue processors...')

  // 音频生成队列
  const audioQueue = queueService.getQueue(QueueName.AUDIO_GENERATION)
  audioQueue.process(processAudioGeneration)
  logger.info('Audio generation queue processor registered')

  // 文本解析队列
  const textQueue = queueService.getQueue(QueueName.TEXT_PARSING)
  textQueue.process(processTextParsing)
  logger.info('Text parsing queue processor registered')

  logger.info('All queue processors initialized')
}

/**
 * 关闭所有队列
 */
export async function shutdownQueues() {
  logger.info('Shutting down queues...')
  await queueService.closeAll()
  logger.info('All queues shut down')
}
