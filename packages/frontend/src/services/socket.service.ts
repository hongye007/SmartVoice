import { io, Socket } from 'socket.io-client'

const WEBSOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

/**
 * WebSocket 客户端服务
 * 管理 Socket.io 连接和事件监听
 */
class SocketService {
  private socket: Socket | null = null
  private userId: string | null = null

  /**
   * 连接到 WebSocket 服务器
   */
  connect(userId: string, token: string): void {
    if (this.socket?.connected) {
      console.log('[WebSocket] Already connected')
      return
    }

    console.log('[WebSocket] Connecting to', WEBSOCKET_URL)

    this.socket = io(WEBSOCKET_URL, {
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    })

    this.userId = userId

    // 连接成功
    this.socket.on('connect', () => {
      console.log('[WebSocket] Connected:', this.socket?.id)

      // 发送认证信息
      this.socket?.emit('authenticate', { userId, token })
    })

    // 认证成功
    this.socket.on('authenticated', () => {
      console.log('[WebSocket] Authenticated')
    })

    // 连接错误
    this.socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error)
    })

    // 断开连接
    this.socket.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected:', reason)
    })

    // 重新连接
    this.socket.on('reconnect', (attemptNumber) => {
      console.log('[WebSocket] Reconnected after', attemptNumber, 'attempts')
    })

    // 错误事件
    this.socket.on('error', (error) => {
      console.error('[WebSocket] Error:', error)
    })
  }

  /**
   * 订阅项目事件
   */
  subscribeToProject(projectId: string): void {
    if (!this.socket?.connected) {
      console.warn('[WebSocket] Not connected, cannot subscribe to project')
      return
    }

    this.socket.emit('subscribe:project', projectId)
    console.log('[WebSocket] Subscribed to project:', projectId)
  }

  /**
   * 取消订阅项目事件
   */
  unsubscribeFromProject(projectId: string): void {
    if (!this.socket?.connected) {
      return
    }

    this.socket.emit('unsubscribe:project', projectId)
    console.log('[WebSocket] Unsubscribed from project:', projectId)
  }

  /**
   * 监听音频生成进度
   */
  onAudioProgress(
    callback: (data: {
      projectId: string
      chapterId: string
      jobId: string
      progress: {
        percentage: number
        message?: string
        currentStep?: string
        totalSteps?: number
      }
      timestamp: string
    }) => void
  ): () => void {
    if (!this.socket) {
      console.warn('[WebSocket] Socket not initialized')
      return () => {}
    }

    this.socket.on('audio:progress', callback)

    // 返回取消监听的函数
    return () => {
      this.socket?.off('audio:progress', callback)
    }
  }

  /**
   * 监听音频生成完成
   */
  onAudioComplete(
    callback: (data: {
      projectId: string
      chapterId: string
      jobId: string
      audioUrl: string
      duration: number
      fileSize: number
      timestamp: string
    }) => void
  ): () => void {
    if (!this.socket) {
      console.warn('[WebSocket] Socket not initialized')
      return () => {}
    }

    this.socket.on('audio:complete', callback)

    return () => {
      this.socket?.off('audio:complete', callback)
    }
  }

  /**
   * 监听音频生成失败
   */
  onAudioFailed(
    callback: (data: {
      projectId: string
      chapterId: string
      jobId: string
      error: string
      timestamp: string
    }) => void
  ): () => void {
    if (!this.socket) {
      console.warn('[WebSocket] Socket not initialized')
      return () => {}
    }

    this.socket.on('audio:failed', callback)

    return () => {
      this.socket?.off('audio:failed', callback)
    }
  }

  /**
   * 监听文本解析进度
   */
  onParseProgress(
    callback: (data: {
      projectId: string
      jobId: string
      progress: {
        percentage: number
        message?: string
        currentStep?: string
        totalSteps?: number
      }
      timestamp: string
    }) => void
  ): () => void {
    if (!this.socket) {
      console.warn('[WebSocket] Socket not initialized')
      return () => {}
    }

    this.socket.on('parse:progress', callback)

    return () => {
      this.socket?.off('parse:progress', callback)
    }
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.userId = null
      console.log('[WebSocket] Disconnected')
    }
  }

  /**
   * 获取连接状态
   */
  isConnected(): boolean {
    return this.socket?.connected || false
  }

  /**
   * 获取当前用户 ID
   */
  getUserId(): string | null {
    return this.userId
  }
}

// 导出单例
export const socketService = new SocketService()
