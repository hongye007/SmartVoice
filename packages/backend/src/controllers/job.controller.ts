import type { Response } from 'express'
import type { AuthRequest } from '../middlewares/auth.js'
import { queueService } from '../services/queue/queue.service.js'
import { QueueName } from '../types/queue.js'
import { AppError } from '../middlewares/errorHandler.js'

export class JobController {
  // 获取任务状态
  async getJobStatus(req: AuthRequest, res: Response) {
    const { queueName, jobId } = req.params

    if (!Object.values(QueueName).includes(queueName as QueueName)) {
      throw new AppError('Invalid queue name', 400)
    }

    const job = await queueService.getJob(queueName as QueueName, jobId)

    if (!job) {
      throw new AppError('Job not found', 404)
    }

    const state = await job.getState()
    const progress = job.progress()
    const failedReason = job.failedReason

    res.json({
      success: true,
      data: {
        jobId: job.id,
        queueName,
        state,
        progress,
        failedReason,
        attemptsMade: job.attemptsMade,
        data: job.data,
        returnValue: job.returnvalue,
        createdAt: new Date(job.timestamp),
        processedAt: job.processedOn ? new Date(job.processedOn) : null,
        finishedAt: job.finishedOn ? new Date(job.finishedOn) : null,
      },
    })
  }

  // 获取队列统计信息
  async getQueueStats(req: AuthRequest, res: Response) {
    const { queueName } = req.params

    if (!Object.values(QueueName).includes(queueName as QueueName)) {
      throw new AppError('Invalid queue name', 400)
    }

    const stats = await queueService.getQueueStats(queueName as QueueName)

    res.json({
      success: true,
      data: stats,
    })
  }

  // 获取所有队列统计信息
  async getAllQueuesStats(req: AuthRequest, res: Response) {
    const stats = await Promise.all(
      Object.values(QueueName).map(async (queueName) => ({
        queueName,
        ...(await queueService.getQueueStats(queueName)),
      }))
    )

    res.json({
      success: true,
      data: stats,
    })
  }
}

export const jobController = new JobController()
