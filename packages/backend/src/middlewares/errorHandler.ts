import { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger.js'

export class AppError extends Error {
  statusCode: number
  isOperational: boolean

  constructor(message: string, statusCode: number) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true
    Error.captureStackTrace(this, this.constructor)
  }
}

// Async handler wrapper to catch errors in async route handlers
export const asyncHandler =
  (fn: (req: any, res: Response, next?: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    logger.error(`${err.statusCode} - ${err.message}`)
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    })
  }

  logger.error(`500 - ${err.message}`, { stack: err.stack })
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
  })
}
