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
      'string.email': '请提供有效的邮箱地址',
      'any.required': '邮箱不能为空',
    }),
    username: Joi.string().min(2).max(50).required().messages({
      'string.min': '用户名至少需要2个字符',
      'string.max': '用户名不能超过50个字符',
      'any.required': '用户名不能为空',
    }),
    password: Joi.string().min(6).max(100).required().messages({
      'string.min': '密码至少需要6个字符',
      'string.max': '密码不能超过100个字符',
      'any.required': '密码不能为空',
    }),
  }),

  login: Joi.object({
    email: Joi.string().required().messages({
      'any.required': '请输入用户名或邮箱',
      'string.empty': '请输入用户名或邮箱',
    }),
    password: Joi.string().required().messages({
      'any.required': '密码不能为空',
      'string.empty': '密码不能为空',
    }),
  }),

  createProject: Joi.object({
    name: Joi.string().min(1).max(200).required().messages({
      'string.min': '项目名称不能为空',
      'string.max': '项目名称不能超过200个字符',
      'any.required': '项目名称不能为空',
    }),
    description: Joi.string().max(1000).optional().allow(''),
  }),
}
