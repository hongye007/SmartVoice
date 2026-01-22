import { prisma } from '../utils/prisma.js'
import { AppError } from '../middlewares/errorHandler.js'
import type { ExtractedCharacter } from '../types/parser.js'

export class CharacterService {
  // 批量创建角色
  async batchCreate(projectId: string, characters: ExtractedCharacter[]) {
    return prisma.character.createMany({
      data: characters.map((char) => ({
        projectId,
        name: char.name,
        gender: char.gender,
        dialogueCount: char.dialogueCount,
        // voiceConfig 存储样本对话
        voiceConfig: JSON.stringify({
          sampleDialogues: char.sampleDialogues,
        }),
      })),
    })
  }

  // 获取项目的所有角色
  async getByProject(projectId: string, userId: string) {
    // 验证项目所有权
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
    })

    if (!project) {
      throw new AppError('Project not found', 404)
    }

    return prisma.character.findMany({
      where: { projectId },
      orderBy: { dialogueCount: 'desc' },
    })
  }

  // 获取单个角色详情
  async getById(characterId: string, userId: string) {
    const character = await prisma.character.findUnique({
      where: { id: characterId },
      include: {
        project: {
          select: { userId: true },
        },
      },
    })

    if (!character) {
      throw new AppError('Character not found', 404)
    }

    if (character.project.userId !== userId) {
      throw new AppError('Unauthorized', 403)
    }

    return character
  }

  // 更新角色（手动修正）
  async update(
    characterId: string,
    userId: string,
    data: {
      name?: string
      gender?: 'MALE' | 'FEMALE' | 'UNKNOWN'
      voiceId?: string
      voiceConfig?: Record<string, any>
    }
  ) {
    // 验证权限
    await this.getById(characterId, userId)

    return prisma.character.update({
      where: { id: characterId },
      data: {
        ...data,
        voiceConfig: data.voiceConfig ? JSON.stringify(data.voiceConfig) : undefined,
      },
    })
  }

  // 删除角色
  async delete(characterId: string, userId: string) {
    // 验证权限
    await this.getById(characterId, userId)

    return prisma.character.delete({
      where: { id: characterId },
    })
  }
}

export const characterService = new CharacterService()
