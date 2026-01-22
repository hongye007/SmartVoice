import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { config } from './config/index.js'
import { logger } from './utils/logger.js'
import { errorHandler } from './middlewares/errorHandler.js'
import authRoutes from './routes/auth.routes.js'
import projectRoutes from './routes/project.routes.js'
import chapterRoutes from './routes/chapter.routes.js'
import characterRoutes from './routes/character.routes.js'

const app = express()

// Security middleware
app.use(helmet())
app.use(cors({ origin: config.corsOrigin, credentials: true }))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
})
app.use('/api/', limiter)

// Body parsing
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Request logging
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`)
  next()
})

// Health check
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'SmartVoice API is running',
    timestamp: new Date().toISOString(),
  })
})

// API routes
app.get('/api', (_req, res) => {
  res.json({
    success: true,
    message: 'SmartVoice API v0.1.0',
    endpoints: {
      health: 'GET /health',
      auth: 'POST /api/auth/register, POST /api/auth/login',
      projects: 'GET /api/projects, POST /api/projects',
    },
  })
})

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/chapters', chapterRoutes)
app.use('/api/characters', characterRoutes)

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  })
})

// Error handler
app.use(errorHandler)

export default app
