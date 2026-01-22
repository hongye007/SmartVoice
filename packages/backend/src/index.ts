import app from './app.js'
import { config } from './config/index.js'
import { logger } from './utils/logger.js'
import { prisma } from './utils/prisma.js'
import { initializeQueues, shutdownQueues } from './services/queue/index.js'

const startServer = async () => {
  try {
    // Initialize database connection
    await prisma.$connect()
    logger.info('✅ Database connected')

    // Initialize queues
    initializeQueues()
    logger.info('✅ Task queues initialized')

    // Start server
    app.listen(config.port, () => {
      logger.info(`🚀 Server running on port ${config.port}`)
      logger.info(`📍 Environment: ${config.nodeEnv}`)
      logger.info(`🔗 Health check: http://localhost:${config.port}/health`)
      logger.info(`🔗 API endpoint: http://localhost:${config.port}/api`)
    })
  } catch (error) {
    logger.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server')
  await shutdownQueues()
  await prisma.$disconnect()
  logger.info('Database disconnected')
  process.exit(0)
})

startServer()
