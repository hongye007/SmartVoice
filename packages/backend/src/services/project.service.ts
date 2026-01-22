import { prisma } from '../utils/prisma.js'
import { storageService } from './storage/storage.service.js'
import { AppError } from '../middlewares/errorHandler.js'
import type { CreateProjectDTO, UpdateProjectDTO } from '../types/index.js'

export class ProjectService {
  // 创建项目（上传文件）
  async createProject(userId: string, data: CreateProjectDTO, file?: Express.Multer.File) {
    if (!file) {
      throw new AppError('File is required', 400)
    }

    // 验证文件类型
    const allowedTypes = ['text/plain', 'application/epub+zip']
    if (!allowedTypes.includes(file.mimetype)) {
      throw new AppError('Only .txt and .epub files are allowed', 400)
    }

    // 验证文件大小 (10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      throw new AppError('File size must not exceed 10MB', 400)
    }

    // 上传文件到 MinIO
    const filename = await storageService.uploadFile({
      buffer: file.buffer,
      originalname: file.originalname,
      mimetype: file.mimetype,
      folder: 'projects',
    })

    const fileUrl = storageService.getFileUrl(filename)

    // 创建项目记录
    const project = await prisma.project.create({
      data: {
        userId,
        name: data.name,
        description: data.description,
        fileUrl,
        status: 'PENDING',
      },
    })

    return project
  }

  // 获取用户的项目列表
  async getUserProjects(userId: string) {
    const projects = await prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            chapters: true,
            characters: true,
            audios: true,
          },
        },
      },
    })

    return projects
  }

  // 获取项目详情
  async getProjectById(projectId: string, userId: string) {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
      include: {
        chapters: {
          orderBy: { order: 'asc' },
        },
        characters: true,
        audios: true,
      },
    })

    if (!project) {
      throw new AppError('Project not found', 404)
    }

    return project
  }

  // 更新项目
  async updateProject(projectId: string, userId: string, data: UpdateProjectDTO) {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
    })

    if (!project) {
      throw new AppError('Project not found', 404)
    }

    const updated = await prisma.project.update({
      where: { id: projectId },
      data,
    })

    return updated
  }

  // 删除项目
  async deleteProject(projectId: string, userId: string) {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
    })

    if (!project) {
      throw new AppError('Project not found', 404)
    }

    // 删除关联文件
    // TODO: 删除所有章节音频文件

    // 删除项目（级联删除章节、角色、音频）
    await prisma.project.delete({
      where: { id: projectId },
    })

    return { message: 'Project deleted successfully' }
  }
}

export const projectService = new ProjectService()
