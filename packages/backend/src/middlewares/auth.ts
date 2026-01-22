import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { config } from '../config/index.js'
import { AppError } from './errorHandler.js'

export interface AuthRequest extends Request {
  userId?: string
}

export const authenticate = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      throw new AppError('No token provided', 401)
    }

    const decoded = jwt.verify(token, config.jwt.secret) as { userId: string }
    req.userId = decoded.userId
    next()
  } catch (error) {
    next(new AppError('Invalid token', 401))
  }
}
