import { Client } from 'minio'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import { config } from '../../config/index.js'
import { logger } from '../../utils/logger.js'
import type { StorageAdapter, UploadOptions } from '../../types/storage.js'

export class MinIOAdapter implements StorageAdapter {
  private client: Client
  private bucket: string

  constructor() {
    this.bucket = config.minio.bucket

    this.client = new Client({
      endPoint: config.minio.endpoint,
      port: config.minio.port,
      useSSL: config.minio.useSSL,
      accessKey: config.minio.accessKey,
      secretKey: config.minio.secretKey,
    })

    this.initialize()
  }

  private async initialize() {
    try {
      // 检查 bucket 是否存在，不存在则创建
      const exists = await this.client.bucketExists(this.bucket)
      if (!exists) {
        await this.client.makeBucket(this.bucket, 'us-east-1')
        logger.info(`MinIO bucket '${this.bucket}' created`)

        // 设置为公开读取
        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${this.bucket}/*`],
            },
          ],
        }
        await this.client.setBucketPolicy(this.bucket, JSON.stringify(policy))
      }
      logger.info('MinIO adapter initialized')
    } catch (error) {
      logger.error('Failed to initialize MinIO:', error)
    }
  }

  async uploadFile(
    buffer: Buffer,
    originalFilename: string,
    mimetype: string,
    folder: string = 'uploads'
  ): Promise<string> {
    try {
      // 生成唯一文件名
      const ext = path.extname(originalFilename)
      const filename = `${folder}/${uuidv4()}${ext}`

      // 上传文件
      await this.client.putObject(this.bucket, filename, buffer, buffer.length, {
        'Content-Type': mimetype,
      })

      logger.info(`File uploaded to MinIO: ${filename}`)

      return filename
    } catch (error) {
      logger.error('MinIO upload error:', error)
      throw new Error('Failed to upload file')
    }
  }

  getFileUrl(filename: string): string {
    // 本地开发环境或自部署环境
    return `http://${config.minio.endpoint}:${config.minio.port}/${this.bucket}/${filename}`
  }

  async deleteFile(filename: string): Promise<void> {
    try {
      await this.client.removeObject(this.bucket, filename)
      logger.info(`File deleted from MinIO: ${filename}`)
    } catch (error) {
      logger.error('MinIO delete error:', error)
      throw new Error('Failed to delete file')
    }
  }

  async fileExists(filename: string): Promise<boolean> {
    try {
      await this.client.statObject(this.bucket, filename)
      return true
    } catch (error) {
      return false
    }
  }

  // 生成预签名 URL (用于临时访问)
  async getPresignedUrl(filename: string, expirySeconds: number = 3600): Promise<string> {
    try {
      const url = await this.client.presignedGetObject(this.bucket, filename, expirySeconds)
      return url
    } catch (error) {
      logger.error('MinIO presigned URL error:', error)
      throw new Error('Failed to generate presigned URL')
    }
  }
}

// 导出单例
export const minioAdapter = new MinIOAdapter()
