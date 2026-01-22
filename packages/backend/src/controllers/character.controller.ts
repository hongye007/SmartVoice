import type { Response } from 'express'
import type { AuthRequest } from '../middlewares/auth.js'
import { characterService } from '../services/character.service.js'

export class CharacterController {
  // 获取项目的所有角色
  async getProjectCharacters(req: AuthRequest, res: Response) {
    const { projectId } = req.params
    const userId = req.userId!

    const characters = await characterService.getByProject(projectId, userId)

    res.json({
      success: true,
      data: characters,
    })
  }

  // 获取角色详情
  async getCharacter(req: AuthRequest, res: Response) {
    const { characterId } = req.params
    const userId = req.userId!

    const character = await characterService.getById(characterId, userId)

    res.json({
      success: true,
      data: character,
    })
  }

  // 更新角色（手动修正）
  async updateCharacter(req: AuthRequest, res: Response) {
    const { characterId } = req.params
    const userId = req.userId!
    const { name, gender, voiceId, voiceConfig } = req.body

    const character = await characterService.update(characterId, userId, {
      name,
      gender,
      voiceId,
      voiceConfig,
    })

    res.json({
      success: true,
      data: character,
      message: 'Character updated successfully',
    })
  }

  // 删除角色
  async deleteCharacter(req: AuthRequest, res: Response) {
    const { characterId } = req.params
    const userId = req.userId!

    await characterService.delete(characterId, userId)

    res.json({
      success: true,
      message: 'Character deleted successfully',
    })
  }
}

export const characterController = new CharacterController()
