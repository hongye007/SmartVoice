import { minioAdapter } from './minio.adapter.js'
import type { StorageAdapter, UploadOptions } from '../../types/storage.js'

class StorageService {
  private adapter: StorageAdapter

  constructor() {
    // 默认使用 MinIO
    // 后续可以根据环境变量切换到 OSS: config.storage.type === 'oss' ? ossAdapter : minioAdapter
    this.adapter = minioAdapter
  }

  async uploadFile(options: UploadOptions): Promise<string> {
    const { buffer, originalname, mimetype, folder = 'uploads' } = options
    return this.adapter.uploadFile(buffer, originalname, mimetype, folder)
  }

  getFileUrl(filename: string): string {
    return this.adapter.getFileUrl(filename)
  }

  async deleteFile(filename: string): Promise<void> {
    return this.adapter.deleteFile(filename)
  }

  async fileExists(filename: string): Promise<boolean> {
    return this.adapter.fileExists(filename)
  }
}

export const storageService = new StorageService()
