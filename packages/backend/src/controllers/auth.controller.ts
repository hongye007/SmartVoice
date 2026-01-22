import { Request, Response, NextFunction } from 'express'
import { authService } from '../services/auth.service.js'
import type { AuthRequest } from '../middlewares/auth.js'
import type { CreateUserDTO, LoginDTO } from '../types/index.js'

export class AuthController {
  // 用户注册
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const data: CreateUserDTO = req.body
      const result = await authService.register(data)

      res.status(201).json({
        success: true,
        data: result,
        message: 'User registered successfully',
      })
    } catch (error) {
      next(error)
    }
  }

  // 用户登录
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const data: LoginDTO = req.body
      const result = await authService.login(data)

      res.json({
        success: true,
        data: result,
        message: 'Login successful',
      })
    } catch (error) {
      next(error)
    }
  }

  // 获取当前用户信息
  async getCurrentUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await authService.getCurrentUser(req.userId!)

      res.json({
        success: true,
        data: user,
      })
    } catch (error) {
      next(error)
    }
  }

  // 登出（客户端清除 token）
  async logout(_req: Request, res: Response) {
    res.json({
      success: true,
      message: 'Logout successful',
    })
  }
}

export const authController = new AuthController()
