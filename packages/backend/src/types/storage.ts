// 存储适配器接口
export interface StorageAdapter {
  uploadFile(file: Buffer, filename: string, mimetype: string): Promise<string>
  getFileUrl(filename: string): string
  deleteFile(filename: string): Promise<void>
  fileExists(filename: string): Promise<boolean>
}

// 文件上传选项
export interface UploadOptions {
  buffer: Buffer
  originalname: string
  mimetype: string
  folder?: string
}
