import { Router } from 'express'
import { jobController } from '../controllers/job.controller.js'
import { authenticate } from '../middlewares/auth.js'
import { asyncHandler } from '../middlewares/errorHandler.js'

const router = Router()

// 所有路由需要认证
router.use(authenticate)

// GET /api/jobs/:queueName/:jobId - 获取任务状态
router.get(
  '/:queueName/:jobId',
  asyncHandler(jobController.getJobStatus.bind(jobController))
)

// GET /api/jobs/:queueName/stats - 获取队列统计
router.get(
  '/:queueName/stats',
  asyncHandler(jobController.getQueueStats.bind(jobController))
)

// GET /api/jobs/stats - 获取所有队列统计
router.get('/stats', asyncHandler(jobController.getAllQueuesStats.bind(jobController)))

export default router
