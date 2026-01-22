import api, { handleApiError } from './api'
import type { ApiResponse, Project, Chapter, Character, Audio, JobStatus } from '../types/api'

export const projectService = {
  // 获取项目列表
  async getProjects(): Promise<Project[]> {
    try {
      const response = await api.get<ApiResponse<Project[]>>('/projects')
      return response.data.data || []
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },

  // 获取项目详情
  async getProject(id: string): Promise<Project> {
    try {
      const response = await api.get<ApiResponse<Project>>(`/projects/${id}`)
      return response.data.data!
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },

  // 创建项目
  async createProject(name: string, file: File): Promise<Project> {
    try {
      const formData = new FormData()
      formData.append('name', name)
      formData.append('file', file)

      const response = await api.post<ApiResponse<Project>>('/projects', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return response.data.data!
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },

  // 解析项目
  async parseProject(id: string, useAI: boolean = true): Promise<{ jobId: string }> {
    try {
      const response = await api.post<ApiResponse<{ jobId: string }>>(
        `/projects/${id}/parse`,
        { useAI }
      )
      return response.data.data!
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },

  // 获取章节列表
  async getChapters(projectId: string): Promise<Chapter[]> {
    try {
      const response = await api.get<ApiResponse<Chapter[]>>(`/projects/${projectId}/chapters`)
      return response.data.data || []
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },

  // 获取角色列表
  async getCharacters(projectId: string): Promise<Character[]> {
    try {
      const response = await api.get<ApiResponse<Character[]>>(`/projects/${projectId}/characters`)
      return response.data.data || []
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },

  // 更新角色音色
  async updateCharacterVoice(
    characterId: string,
    voiceId: string,
    voiceConfig?: any
  ): Promise<Character> {
    try {
      const response = await api.put<ApiResponse<Character>>(`/characters/${characterId}`, {
        voiceId,
        voiceConfig,
      })
      return response.data.data!
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },

  // 生成章节音频
  async generateChapterAudio(chapterId: string): Promise<{ jobId: string }> {
    try {
      const response = await api.post<ApiResponse<{ jobId: string }>>(
        `/tts/chapters/${chapterId}/generate`
      )
      return response.data.data!
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },

  // 获取章节音频
  async getChapterAudio(chapterId: string): Promise<Audio> {
    try {
      const response = await api.get<ApiResponse<Audio>>(`/tts/chapters/${chapterId}/audio`)
      return response.data.data!
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },

  // 获取任务状态
  async getJobStatus(queueName: string, jobId: string): Promise<JobStatus> {
    try {
      const response = await api.get<ApiResponse<JobStatus>>(`/jobs/${queueName}/${jobId}`)
      return response.data.data!
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },

  // 删除项目
  async deleteProject(id: string): Promise<void> {
    try {
      await api.delete(`/projects/${id}`)
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },
}
