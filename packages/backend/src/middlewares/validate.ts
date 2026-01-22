import { Request, Response, NextFunction } from 'express'
import Joi from 'joi'
import { AppError } from './errorHandler.js'

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    })

    if (error) {
      const message = error.details.map(detail => detail.message).join(', ')
      return next(new AppError(message, 400))
    }

    req.body = value
    next()
  }
}

// 常用验证规则
export const schemas = {
  register: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email',
      'any.required': 'Email is required',
    }),
    username: Joi.string().min(2).max(50).required().messages({
      'string.min': 'Username must be at least 2 characters',
      'string.max': 'Username must not exceed 50 characters',
      'any.required': 'Username is required',
    }),
    password: Joi.string().min(6).max(100).required().messages({
      'string.min': 'Password must be at least 6 characters',
      'string.max': 'Password must not exceed 100 characters',
      'any.required': 'Password is required',
    }),
  }),

  login: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email',
      'any.required': 'Email is required',
    }),
    password: Joi.string().required().messages({
      'any.required': 'Password is required',
    }),
  }),

  createProject: Joi.object({
    name: Joi.string().min(1).max(200).required().messages({
      'string.min': 'Project name is required',
      'string.max': 'Project name must not exceed 200 characters',
      'any.required': 'Project name is required',
    }),
    description: Joi.string().max(1000).optional().allow(''),
  }),
}
