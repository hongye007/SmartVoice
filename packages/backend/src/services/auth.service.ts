import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { config } from '../config/index.js'
import { prisma } from '../utils/prisma.js'
import { AppError } from '../middlewares/errorHandler.js'
import type { CreateUserDTO, LoginDTO } from '../types/index.js'

export class AuthService {
  // 注册新用户
  async register(data: CreateUserDTO) {
    // 检查邮箱是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    })

    if (existingUser) {
      throw new AppError('该邮箱已被注册', 400)
    }

    // 检查用户名是否已存在
    const existingUsername = await prisma.user.findFirst({
      where: { username: data.username },
    })

    if (existingUsername) {
      throw new AppError('该用户名已被使用', 400)
    }

    // 哈希密码
    const hashedPassword = await bcrypt.hash(data.password, 10)

    // 创建用户
    const user = await prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        username: true,
        quota: true,
        createdAt: true,
      },
    })

    // 生成 JWT token
    const token = this.generateToken(user.id)

    return { user, token }
  }

  // 用户登录
  async login(data: LoginDTO) {
    // 查找用户（支持邮箱或用户名登录）
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email },
          { username: data.email }, // email字段也可能是用户名
        ],
      },
    })

    if (!user) {
      throw new AppError('用户不存在或密码错误', 401)
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(data.password, user.password)

    if (!isPasswordValid) {
      throw new AppError('用户不存在或密码错误', 401)
    }

    // 生成 JWT token
    const token = this.generateToken(user.id)

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        quota: user.quota,
        createdAt: user.createdAt,
      },
      token,
    }
  }

  // 获取当前用户信息
  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        quota: true,
        createdAt: true,
      },
    })

    if (!user) {
      throw new AppError('User not found', 404)
    }

    return user
  }

  // 生成 JWT token
  private generateToken(userId: string): string {
    return jwt.sign({ userId }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    })
  }
}

export const authService = new AuthService()
