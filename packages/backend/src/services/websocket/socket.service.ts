import { Server as SocketServer } from 'socket.io'
import type { Server as HttpServer } from 'http'
import { logger } from '../../utils/logger.js'
import { config } from '../../config/index.js'

/**
 * WebSocket 服务
 * 管理 Socket.io 连接和实时事件推送
 */
class SocketService {
  private io: SocketServer | null = null
  private userSockets: Map<string, Set<string>> = new Map() // userId -> Set<socketId>

  /**
   * 初始化 Socket.io 服务器
   */
  initialize(httpServer: HttpServer): void {
    this.io = new SocketServer(httpServer, {
      cors: {
        origin: config.corsOrigin,
        credentials: true,
      },
      path: '/socket.io/',
    })

    this.setupEventHandlers()
    logger.info('✅ WebSocket server initialized')
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers(): void {
    if (!this.io) return

    this.io.on('connection', (socket) => {
      logger.info(`Client connected: ${socket.id}`)

      // 用户认证和注册
      socket.on('authenticate', (data: { userId: string; token: string }) => {
        const { userId } = data

        if (!userId) {
          socket.emit('error', { message: 'User ID is required' })
          return
        }

        // TODO: 验证 token（可选，增强安全性）

        // 将 socket 关联到用户
        if (!this.userSockets.has(userId)) {
          this.userSockets.set(userId, new Set())
        }
        this.userSockets.get(userId)!.add(socket.id)

        // 将 socket 加入用户房间
        socket.join(`user:${userId}`)

        logger.info(`User ${userId} authenticated on socket ${socket.id}`)
        socket.emit('authenticated', { success: true })
      })

      // 订阅项目事件
      socket.on('subscribe:project', (projectId: string) => {
        socket.join(`project:${projectId}`)
        logger.debug(`Socket ${socket.id} subscribed to project ${projectId}`)
      })

      // 取消订阅项目事件
      socket.on('unsubscribe:project', (projectId: string) => {
        socket.leave(`project:${projectId}`)
        logger.debug(`Socket ${socket.id} unsubscribed from project ${projectId}`)
      })

      // 断开连接
      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`)

        // 从用户映射中移除
        this.userSockets.forEach((sockets, userId) => {
          if (sockets.has(socket.id)) {
            sockets.delete(socket.id)
            if (sockets.size === 0) {
              this.userSockets.delete(userId)
            }
          }
        })
      })
    })
  }

  /**
   * 推送音频生成进度更新
   */
  emitAudioProgress(data: {
    userId: string
    projectId: string
    chapterId: string
    jobId: string
    progress: {
      percentage: number
      message?: string
      currentStep?: string
      totalSteps?: number
    }
  }): void {
    if (!this.io) return

    const { userId, projectId, chapterId, jobId, progress } = data

    // 推送给用户的所有连接
    this.io.to(`user:${userId}`).emit('audio:progress', {
      projectId,
      chapterId,
      jobId,
      progress,
      timestamp: new Date().toISOString(),
    })

    logger.debug(
      `Audio progress emitted to user ${userId}: chapter ${chapterId}, ${progress.percentage}%`
    )
  }

  /**
   * 推送音频生成完成事件
   */
  emitAudioComplete(data: {
    userId: string
    projectId: string
    chapterId: string
    jobId: string
    audioUrl: string
    duration: number
    fileSize: number
  }): void {
    if (!this.io) return

    const { userId, projectId, chapterId, jobId, audioUrl, duration, fileSize } = data

    this.io.to(`user:${userId}`).emit('audio:complete', {
      projectId,
      chapterId,
      jobId,
      audioUrl,
      duration,
      fileSize,
      timestamp: new Date().toISOString(),
    })

    logger.info(
      `Audio complete event emitted to user ${userId}: chapter ${chapterId}`
    )
  }

  /**
   * 推送音频生成失败事件
   */
  emitAudioFailed(data: {
    userId: string
    projectId: string
    chapterId: string
    jobId: string
    error: string
  }): void {
    if (!this.io) return

    const { userId, projectId, chapterId, jobId, error } = data

    this.io.to(`user:${userId}`).emit('audio:failed', {
      projectId,
      chapterId,
      jobId,
      error,
      timestamp: new Date().toISOString(),
    })

    logger.error(
      `Audio failed event emitted to user ${userId}: chapter ${chapterId}, error: ${error}`
    )
  }

  /**
   * 推送文本解析进度更新
   */
  emitParseProgress(data: {
    userId: string
    projectId: string
    jobId: string
    progress: {
      percentage: number
      message?: string
      currentStep?: string
      totalSteps?: number
    }
  }): void {
    if (!this.io) return

    const { userId, projectId, jobId, progress } = data

    this.io.to(`user:${userId}`).emit('parse:progress', {
      projectId,
      jobId,
      progress,
      timestamp: new Date().toISOString(),
    })

    logger.debug(
      `Parse progress emitted to user ${userId}: project ${projectId}, ${progress.percentage}%`
    )
  }

  /**
   * 获取 Socket.io 实例
   */
  getIO(): SocketServer | null {
    return this.io
  }

  /**
   * 获取用户的在线 socket 数量
   */
  getUserSocketCount(userId: string): number {
    return this.userSockets.get(userId)?.size || 0
  }

  /**
   * 关闭 WebSocket 服务器
   */
  close(): void {
    if (this.io) {
      this.io.close()
      this.userSockets.clear()
      logger.info('WebSocket server closed')
    }
  }
}

// 导出单例
export const socketService = new SocketService()
