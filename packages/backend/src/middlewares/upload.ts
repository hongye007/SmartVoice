import multer from 'multer'

// 使用内存存储（文件将存储在 Buffer 中）
const storage = multer.memoryStorage()

// 文件过滤器
const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // 允许的文件类型
  const allowedTypes = ['text/plain', 'application/epub+zip']

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Only .txt and .epub files are allowed'))
  }
}

// Multer 配置
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
})
