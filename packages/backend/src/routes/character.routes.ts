import { Router } from 'express'
import { characterController } from '../controllers/character.controller.js'
import { authenticate } from '../middlewares/auth.js'
import { asyncHandler } from '../middlewares/errorHandler.js'

const router = Router()

// 所有路由需要认证
router.use(authenticate)

// 获取角色详情
router.get('/:characterId', asyncHandler(characterController.getCharacter.bind(characterController)))

// 更新角色
router.put(
  '/:characterId',
  asyncHandler(characterController.updateCharacter.bind(characterController))
)

// 删除角色
router.delete(
  '/:characterId',
  asyncHandler(characterController.deleteCharacter.bind(characterController))
)

export default router
