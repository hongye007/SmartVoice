import type { Response } from 'express'
import type { AuthRequest } from '../middlewares/auth.js'
import { chapterService } from '../services/chapter.service.js'

export class ChapterController {
  // 获取项目的所有章节
  async getProjectChapters(req: AuthRequest, res: Response) {
    const { projectId } = req.params
    const userId = req.userId!

    const chapters = await chapterService.getByProject(projectId, userId)

    res.json({
      success: true,
      data: chapters,
    })
  }

  // 获取章节详情
  async getChapter(req: AuthRequest, res: Response) {
    const { chapterId } = req.params
    const userId = req.userId!

    const chapter = await chapterService.getById(chapterId, userId)

    res.json({
      success: true,
      data: chapter,
    })
  }

  // 更新章节
  async updateChapter(req: AuthRequest, res: Response) {
    const { chapterId } = req.params
    const userId = req.userId!
    const { title, content } = req.body

    const chapter = await chapterService.update(chapterId, userId, {
      title,
      content,
    })

    res.json({
      success: true,
      data: chapter,
      message: 'Chapter updated successfully',
    })
  }

  // 删除章节
  async deleteChapter(req: AuthRequest, res: Response) {
    const { chapterId } = req.params
    const userId = req.userId!

    await chapterService.delete(chapterId, userId)

    res.json({
      success: true,
      message: 'Chapter deleted successfully',
    })
  }
}

export const chapterController = new ChapterController()
