import dotenv from 'dotenv'

dotenv.config()

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',

  // Database
  databaseUrl: process.env.DATABASE_URL!,

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-jwt-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // MinIO
  minio: {
    endpoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000', 10),
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    bucket: process.env.MINIO_BUCKET || 'smartvoice',
    useSSL: false,
  },

  // Coqui TTS
  coquiTTS: {
    url: process.env.COQUI_TTS_URL || 'http://localhost:5002',
  },

  // Xfyun TTS (讯飞 - 推荐)
  xfyunTTS: {
    appId: process.env.XFYUN_TTS_APP_ID || '',
    apiKey: process.env.XFYUN_TTS_API_KEY || '',
    apiSecret: process.env.XFYUN_TTS_API_SECRET || '',
    apiUrl: process.env.XFYUN_TTS_API_URL || 'wss://tts-api.xfyun.cn/v2/tts',
  },

  // Deepseek API
  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    apiUrl: process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com',
  },

  // Baidu TTS (Fallback)
  baiduTTS: {
    appId: process.env.BAIDU_TTS_APP_ID || '',
    apiKey: process.env.BAIDU_TTS_API_KEY || '',
    secretKey: process.env.BAIDU_TTS_SECRET_KEY || '',
  },

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
}
