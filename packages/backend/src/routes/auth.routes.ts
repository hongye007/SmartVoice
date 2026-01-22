import { Router } from 'express'
import { authController } from '../controllers/auth.controller.js'
import { validate, schemas } from '../middlewares/validate.js'
import { authenticate } from '../middlewares/auth.js'

const router = Router()

// POST /api/auth/register - 用户注册
router.post('/register', validate(schemas.register), (req, res, next) =>
  authController.register(req, res, next)
)

// POST /api/auth/login - 用户登录
router.post('/login', validate(schemas.login), (req, res, next) =>
  authController.login(req, res, next)
)

// GET /api/auth/me - 获取当前用户信息
router.get('/me', authenticate, (req, res, next) =>
  authController.getCurrentUser(req, res, next)
)

// POST /api/auth/logout - 登出
router.post('/logout', (req, res) => authController.logout(req, res))

export default router
