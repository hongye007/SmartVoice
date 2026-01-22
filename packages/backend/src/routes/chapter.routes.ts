import { Router } from 'express'
import { chapterController } from '../controllers/chapter.controller.js'
import { authenticate } from '../middlewares/auth.js'
import { asyncHandler } from '../middlewares/errorHandler.js'

const router = Router()

// 所有路由需要认证
router.use(authenticate)

// 获取章节详情
router.get('/:chapterId', asyncHandler(chapterController.getChapter.bind(chapterController)))

// 更新章节
router.patch('/:chapterId', asyncHandler(chapterController.updateChapter.bind(chapterController)))

// 删除章节
router.delete('/:chapterId', asyncHandler(chapterController.deleteChapter.bind(chapterController)))

export default router
