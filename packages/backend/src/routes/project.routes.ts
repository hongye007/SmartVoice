import { Router } from 'express'
import { projectController } from '../controllers/project.controller.js'
import { parserController } from '../controllers/parser.controller.js'
import { chapterController } from '../controllers/chapter.controller.js'
import { characterController } from '../controllers/character.controller.js'
import { authenticate } from '../middlewares/auth.js'
import { upload } from '../middlewares/upload.js'
import { validate, schemas } from '../middlewares/validate.js'
import { asyncHandler } from '../middlewares/errorHandler.js'

const router = Router()

// 所有路由都需要认证
router.use(authenticate)

// POST /api/projects - 创建项目（上传文件）
router.post('/', upload.single('file'), (req, res, next) =>
  projectController.createProject(req, res, next)
)

// GET /api/projects - 获取用户的项目列表
router.get('/', (req, res, next) => projectController.getUserProjects(req, res, next))

// GET /api/projects/:id - 获取项目详情
router.get('/:id', (req, res, next) => projectController.getProjectById(req, res, next))

// PATCH /api/projects/:id - 更新项目
router.patch('/:id', validate(schemas.createProject), (req, res, next) =>
  projectController.updateProject(req, res, next)
)

// DELETE /api/projects/:id - 删除项目
router.delete('/:id', (req, res, next) => projectController.deleteProject(req, res, next))

// POST /api/projects/:projectId/parse - 解析项目文本
router.post(
  '/:projectId/parse',
  asyncHandler(parserController.parseProject.bind(parserController))
)

// POST /api/projects/:projectId/reparse - 重新解析项目
router.post(
  '/:projectId/reparse',
  asyncHandler(parserController.reParseProject.bind(parserController))
)

// GET /api/projects/:projectId/chapters - 获取项目章节列表
router.get(
  '/:projectId/chapters',
  asyncHandler(chapterController.getProjectChapters.bind(chapterController))
)

// GET /api/projects/:projectId/characters - 获取项目角色列表
router.get(
  '/:projectId/characters',
  asyncHandler(characterController.getProjectCharacters.bind(characterController))
)

export default router
