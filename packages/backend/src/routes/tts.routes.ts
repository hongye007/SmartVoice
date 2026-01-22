import { Router } from 'express'
import { ttsController } from '../controllers/tts.controller.js'
import { authenticate } from '../middlewares/auth.js'
import { asyncHandler } from '../middlewares/errorHandler.js'

const router = Router()

// 所有路由需要认证
router.use(authenticate)

// GET /api/tts/voices - 获取所有可用音色
router.get('/voices', asyncHandler(ttsController.getVoices.bind(ttsController)))

// GET /api/tts/voices/:provider - 根据提供商获取音色
router.get('/voices/:provider', asyncHandler(ttsController.getVoicesByProvider.bind(ttsController)))

// POST /api/tts/chapters/:chapterId/generate - 为章节生成音频
router.post(
  '/chapters/:chapterId/generate',
  asyncHandler(ttsController.generateChapterAudio.bind(ttsController))
)

// POST /api/tts/projects/:projectId/generate - 批量生成项目音频
router.post(
  '/projects/:projectId/generate',
  asyncHandler(ttsController.generateProjectAudios.bind(ttsController))
)

// GET /api/tts/chapters/:chapterId/audio - 获取章节音频信息
router.get(
  '/chapters/:chapterId/audio',
  asyncHandler(ttsController.getChapterAudio.bind(ttsController))
)

export default router
