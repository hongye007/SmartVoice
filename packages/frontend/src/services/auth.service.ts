import api, { handleApiError } from './api'
import type { ApiResponse, User, AuthResponse } from '../types/api'

export const authService = {
  // 注册
  async register(email: string, username: string, password: string): Promise<AuthResponse> {
    try {
      const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', {
        email,
        username,
        password,
      })
      const { user, token } = response.data.data!
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      return response.data.data!
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },

  // 登录
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', {
        email,
        password,
      })
      const { user, token } = response.data.data!
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      return response.data.data!
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },

  // 登出
  logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  },

  // 获取当前用户
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  },

  // 检查是否已登录
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token')
  },
}
