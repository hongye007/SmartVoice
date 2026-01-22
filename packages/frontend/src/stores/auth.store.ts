import { create } from 'zustand'
import type { User } from '../types/api'
import { authService } from '../services/auth.service'

interface AuthStore {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null

  login: (email: string, password: string) => Promise<void>
  register: (email: string, username: string, password: string) => Promise<void>
  logout: () => void
  checkAuth: () => void
  clearError: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: authService.getCurrentUser(),
  isAuthenticated: authService.isAuthenticated(),
  loading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ loading: true, error: null })
    try {
      const { user } = await authService.login(email, password)
      set({ user, isAuthenticated: true, loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

  register: async (email: string, username: string, password: string) => {
    set({ loading: true, error: null })
    try {
      const { user } = await authService.register(email, username, password)
      set({ user, isAuthenticated: true, loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

  logout: () => {
    authService.logout()
    set({ user: null, isAuthenticated: false })
  },

  checkAuth: () => {
    const user = authService.getCurrentUser()
    const isAuthenticated = authService.isAuthenticated()
    set({ user, isAuthenticated })
  },

  clearError: () => set({ error: null }),
}))
