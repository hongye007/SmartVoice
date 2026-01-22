import { Response, NextFunction } from 'express'
import { projectService } from '../services/project.service.js'
import type { AuthRequest } from '../middlewares/auth.js'
import type { CreateProjectDTO, UpdateProjectDTO } from '../types/index.js'

export class ProjectController {
  // 创建项目（上传文件）
  async createProject(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data: CreateProjectDTO = req.body
      const file = req.file

      const project = await projectService.createProject(req.userId!, data, file)

      res.status(201).json({
        success: true,
        data: project,
        message: 'Project created successfully',
      })
    } catch (error) {
      next(error)
    }
  }

  // 获取用户的项目列表
  async getUserProjects(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const projects = await projectService.getUserProjects(req.userId!)

      res.json({
        success: true,
        data: projects,
      })
    } catch (error) {
      next(error)
    }
  }

  // 获取项目详情
  async getProjectById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const project = await projectService.getProjectById(id, req.userId!)

      res.json({
        success: true,
        data: project,
      })
    } catch (error) {
      next(error)
    }
  }

  // 更新项目
  async updateProject(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const data: UpdateProjectDTO = req.body

      const project = await projectService.updateProject(id, req.userId!, data)

      res.json({
        success: true,
        data: project,
        message: 'Project updated successfully',
      })
    } catch (error) {
      next(error)
    }
  }

  // 删除项目
  async deleteProject(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const result = await projectService.deleteProject(id, req.userId!)

      res.json({
        success: true,
        ...result,
      })
    } catch (error) {
      next(error)
    }
  }
}

export const projectController = new ProjectController()
