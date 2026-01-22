import Bull, { Queue, Job, JobOptions } from 'bull'
import { config } from '../../config/index.js'
import { logger } from '../../utils/logger.js'
import type { QueueName } from '../../types/queue.js'

/**
 * 队列管理服务
 * 统一管理所有任务队列
 */
export class QueueService {
  private queues: Map<string, Queue> = new Map()

  /**
   * 获取或创建队列
   */
  getQueue<T = any>(name: QueueName): Queue<T> {
    if (!this.queues.has(name)) {
      const queue = new Bull<T>(name, {
        redis: {
          host: config.redis.host,
          port: config.redis.port,
        },
        defaultJobOptions: {
          attempts: 3, // 重试 3 次
          backoff: {
            type: 'exponential',
            delay: 2000, // 指数退避，初始延迟 2 秒
          },
          removeOnComplete: 100, // 保留最近 100 个已完成任务
          removeOnFail: 200, // 保留最近 200 个失败任务
        },
      })

      // 错误处理
      queue.on('error', (error) => {
        logger.error(`Queue ${name} error:`, error)
      })

      queue.on('failed', (job, error) => {
        logger.error(`Job ${job.id} in queue ${name} failed:`, error)
      })

      queue.on('completed', (job) => {
        logger.info(`Job ${job.id} in queue ${name} completed`)
      })

      this.queues.set(name, queue)
      logger.info(`Queue ${name} created`)
    }

    return this.queues.get(name) as Queue<T>
  }

  /**
   * 添加任务到队列
   */
  async addJob<T>(
    queueName: QueueName,
    data: T,
    options?: JobOptions
  ): Promise<Job<T>> {
    const queue = this.getQueue<T>(queueName)
    const job = await queue.add(data, options)
    logger.info(`Job ${job.id} added to queue ${queueName}`)
    return job
  }

  /**
   * 获取任务状态
   */
  async getJob<T>(queueName: QueueName, jobId: string): Promise<Job<T> | null> {
    const queue = this.getQueue<T>(queueName)
    return queue.getJob(jobId)
  }

  /**
   * 获取队列统计信息
   */
  async getQueueStats(queueName: QueueName) {
    const queue = this.getQueue(queueName)
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ])

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    }
  }

  /**
   * 清理队列
   */
  async cleanQueue(queueName: QueueName) {
    const queue = this.getQueue(queueName)
    await queue.clean(0, 'completed')
    await queue.clean(0, 'failed')
    logger.info(`Queue ${queueName} cleaned`)
  }

  /**
   * 暂停队列
   */
  async pauseQueue(queueName: QueueName) {
    const queue = this.getQueue(queueName)
    await queue.pause()
    logger.info(`Queue ${queueName} paused`)
  }

  /**
   * 恢复队列
   */
  async resumeQueue(queueName: QueueName) {
    const queue = this.getQueue(queueName)
    await queue.resume()
    logger.info(`Queue ${queueName} resumed`)
  }

  /**
   * 关闭所有队列
   */
  async closeAll() {
    logger.info('Closing all queues...')
    const closePromises = Array.from(this.queues.values()).map((queue) =>
      queue.close()
    )
    await Promise.all(closePromises)
    this.queues.clear()
    logger.info('All queues closed')
  }
}

export const queueService = new QueueService()
