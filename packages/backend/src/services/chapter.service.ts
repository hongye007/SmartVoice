import { prisma } from '../utils/prisma.js'
import { AppError } from '../middlewares/errorHandler.js'
import type { ParsedChapter } from '../types/parser.js'

export class ChapterService {
  // 批量创建章节
  async batchCreate(projectId: string, chapters: ParsedChapter[]) {
    return prisma.chapter.createMany({
      data: chapters.map((ch) => ({
        projectId,
        title: ch.title,
        content: ch.content,
        order: ch.order,
        wordCount: ch.wordCount,
        status: 'PENDING',
      })),
    })
  }

  // 获取项目的所有章节
  async getByProject(projectId: string, userId: string) {
    // 验证项目所有权
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
    })

    if (!project) {
      throw new AppError('Project not found', 404)
    }

    return prisma.chapter.findMany({
      where: { projectId },
      orderBy: { order: 'asc' },
    })
  }

  // 获取单个章节详情
  async getById(chapterId: string, userId: string) {
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        project: {
          select: { userId: true },
        },
      },
    })

    if (!chapter) {
      throw new AppError('Chapter not found', 404)
    }

    if (chapter.project.userId !== userId) {
      throw new AppError('Unauthorized', 403)
    }

    return chapter
  }

  // 更新章节
  async update(chapterId: string, userId: string, data: { title?: string; content?: string }) {
    // 验证权限
    await this.getById(chapterId, userId)

    return prisma.chapter.update({
      where: { id: chapterId },
      data,
    })
  }

  // 删除章节
  async delete(chapterId: string, userId: string) {
    // 验证权限
    await this.getById(chapterId, userId)

    return prisma.chapter.delete({
      where: { id: chapterId },
    })
  }
}

export const chapterService = new ChapterService()
