import { Router } from 'express'
import { projectController } from '../controllers/project.controller.js'
import { authenticate } from '../middlewares/auth.js'
import { upload } from '../middlewares/upload.js'
import { validate, schemas } from '../middlewares/validate.js'

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

export default router
