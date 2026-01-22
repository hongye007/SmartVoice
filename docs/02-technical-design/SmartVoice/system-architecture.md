# SmartVoice 系统架构设计

**版本:** 2.0
**日期:** 2026-01-22
**状态:** 已确认

---

## 📋 架构概述

基于 SmartVoice 产品需求和技术选型(React + Node.js + PostgreSQL + 自部署优先),本文档描述系统的整体架构、核心模块、数据流和部署方案。

**架构目标:**
- 支持500-1000并发用户
- 高可用性(99.9%)
- 快速迭代(MVP 3个月)
- **成本优化**(MVP ¥2,524/年,低于预算67%)
- 易于扩展
- **服务可配置切换**(Adapter Pattern)

---

## 🏗️ 整体架构

### 架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        用户层 (Client)                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Web 前端     │  │  移动 Web     │  │  管理后台     │          │
│  │ React 18      │  │ 响应式设计    │  │ (V1.0)       │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
└─────────┼──────────────────┼──────────────────┼────────────────┘
          │ HTTPS            │                  │
          │ WebSocket        │                  │
          └──────────────────┼──────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────────┐
│                  API网关层 (Nginx + Node.js)                      │
│  ┌──────────────────────────────────────────────────────┐        │
│  │  - 负载均衡(Nginx)                                    │        │
│  │  - HTTPS加密                                          │        │
│  │  - API限流(每用户100次/分钟)                          │        │
│  │  - JWT认证                                            │        │
│  │  - 日志记录                                           │        │
│  └──────────────────────────────────────────────────────┘        │
└────────────────────────────┬─────────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────────┐
│              应用服务层 (Node.js + Express)                       │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐      │
│  │  用户服务    │  项目服务    │  解析服务    │  角色服务    │      │
│  │ UserService │ProjectService│ParserService│CharacterSvc │      │
│  ├─────────────┼─────────────┼─────────────┼─────────────┤      │
│  │  TTS服务     │  音频服务    │  任务服务    │  通知服务    │      │
│  │  TTSService │ AudioService│ TaskService │NotifySvc    │      │
│  │  (Adapter)  │  (Adapter)  │             │             │      │
│  └─────────────┴─────────────┴─────────────┴─────────────┘      │
│                                                                   │
│  ┌──────────────────────────────────────────────────────┐        │
│  │           异步Worker进程 (TTS生成)                    │        │
│  │  - 从Redis Queue获取任务                              │        │
│  │  - 调用TTS服务(Coqui自部署 或 百度API)                │        │
│  │  - ffmpeg音频拼接                                     │        │
│  │  - 上传音频到存储(MinIO 或 OSS)                       │        │
│  └──────────────────────────────────────────────────────┘        │
└────────────────────────────┬─────────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────────┐
│          服务适配层 (Service Adapter Layer) - 新增               │
│  ┌───────────────┬───────────────┬──────────────────────┐        │
│  │ Storage       │ TTS Provider  │ NLP Provider         │        │
│  │ Factory       │ Factory       │ Factory              │        │
│  │ ┌──────────┐  │ ┌──────────┐  │ ┌──────────┐         │        │
│  │ │MinIO(主) │  │ │Coqui(主) │  │ │Deepseek  │         │        │
│  │ │OSS(备)   │  │ │Baidu(备) │  │ │(主)      │         │        │
│  │ └──────────┘  │ └──────────┘  │ │Qwen(备)  │         │        │
│  └───────────────┴───────────────┴──┴──────────┘         │        │
│  环境变量: STORAGE_PROVIDER, TTS_PROVIDER, NLP_PROVIDER          │
└────────────────────────────┬─────────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────────┐
│                      数据访问层 (Data Access)                     │
│  ┌───────────────┬───────────────┬──────────────┬──────────┐     │
│  │ Prisma ORM    │ Redis Client  │ Bull Queue   │ Storage  │     │
│  │(PostgreSQL)   │(缓存/Session) │(任务队列)    │ Client   │     │
│  └───────────────┴───────────────┴──────────────┴──────────┘     │
└────────────────────────────┬─────────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────────┐
│                        数据存储层 (Storage)                       │
│  ┌───────────────┬───────────────┬──────────────────────┐        │
│  │PostgreSQL 14  │   Redis 7     │  MinIO + TTS Server  │        │
│  │(主数据库)     │(缓存/队列)    │  (自部署服务)        │        │
│  │- 用户表       │- Session      │  ┌────────────────┐  │        │
│  │- 项目表       │- 音频缓存     │  │ MinIO          │  │        │
│  │- 角色表       │- 任务队列     │  │ (S3兼容存储)   │  │        │
│  │- 音频元数据   │- API限流计数  │  └────────────────┘  │        │
│  │               │               │  ┌────────────────┐  │        │
│  │               │               │  │ Coqui TTS      │  │        │
│  │               │               │  │ (GPU推理)      │  │        │
│  │               │               │  └────────────────┘  │        │
│  └───────────────┴───────────────┴──────────────────────┘        │
└────────────────────────────┬─────────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────────┐
│                     第三方服务层 (External - 备用)                │
│  ┌───────────────┬───────────────┬──────────────────────┐        │
│  │阿里云OSS(备用)│百度TTS(备用)  │  Deepseek API(主)    │        │
│  │(对象存储)     │(语音合成)     │  (角色识别NLP)       │        │
│  │- CDN分发      │- 10+音色      │  - ¥0.001/千token    │        │
│  │- 高可用       │- ¥0.15/千字   │  - 准确率>90%        │        │
│  │               │               │  Qwen API(备用)      │        │
│  │               │               │  OpenAI API(备用)    │        │
│  └───────────────┴───────────────┴──────────────────────┘        │
│  ┌───────────────┐                                                │
│  │阿里云ECS(GPU) │ ← 1核4G + Tesla T4 GPU                        │
│  │- 运行所有容器 │                                                │
│  └───────────────┘                                                │
└──────────────────────────────────────────────────────────────────┘
```

### 架构模式

**选择:** **分层单体应用 (Layered Monolith)**

**理由:**
1. **适合MVP快速迭代** - 单体架构开发简单,部署快,适合2人兼职团队和3个月周期
2. **成本最低** - 单服务器即可支撑500-1000并发,符合¥1万预算
3. **技术债务可控** - 模块化分层设计,后续易于拆分为微服务
4. **运维简单** - 无需复杂的服务编排和监控,适合小团队

**后续演进路径:**
- MVP阶段:单体应用
- 成长期(1000+用户):拆分TTS服务为独立服务(高负载模块)
- 成熟期(10000+用户):微服务架构

---

## 🔧 Adapter Pattern 设计

SmartVoice 采用 **Adapter Pattern(适配器模式)** 设计关键服务接口,实现服务提供商的可配置切换和自动Fallback。

### 设计原则

1. **统一接口** - 所有服务提供商实现相同接口
2. **配置驱动** - 通过环境变量切换服务商
3. **自动Fallback** - 主服务失败自动切换备用服务
4. **零业务侵入** - 业务代码无需关心底层实现

### 三大核心Adapter

#### 1. Storage Adapter(存储服务)

**接口定义:**
```typescript
// src/services/storage/IStorageProvider.ts
export interface IStorageProvider {
  upload(file: Buffer | Stream, key: string, options?: UploadOptions): Promise<UploadResult>;
  download(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  getSignedUrl(key: string, options: SignedUrlOptions): Promise<string>;
  healthCheck(): Promise<boolean>;
}

interface UploadResult {
  url: string;
  key: string;
  size: number;
  etag: string;
}
```

**实现:**
```typescript
// MinIO Provider(主)
export class MinIOProvider implements IStorageProvider {
  private client: MinioClient;
  private defaultBucket: string;

  constructor() {
    this.client = new MinioClient({
      endPoint: config.storage.minio.endpoint,
      port: 9000,
      useSSL: false,
      accessKey: config.storage.minio.accessKey,
      secretKey: config.storage.minio.secretKey
    });
    this.defaultBucket = config.storage.minio.bucket;
  }

  async upload(file: Buffer, key: string, options?: UploadOptions): Promise<UploadResult> {
    await this.client.putObject(this.defaultBucket, key, file, options?.metadata);
    const url = `http://${config.storage.minio.endpoint}:9000/${this.defaultBucket}/${key}`;
    return { url, key, size: file.length, etag: '' };
  }

  async download(key: string): Promise<Buffer> {
    const stream = await this.client.getObject(this.defaultBucket, key);
    return streamToBuffer(stream);
  }

  async delete(key: string): Promise<void> {
    await this.client.removeObject(this.defaultBucket, key);
  }

  async getSignedUrl(key: string, options: SignedUrlOptions): Promise<string> {
    return this.client.presignedGetObject(this.defaultBucket, key, options.expiresIn);
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.bucketExists(this.defaultBucket);
      return true;
    } catch {
      return false;
    }
  }
}

// 阿里云OSS Provider(备)
export class AliyunOSSProvider implements IStorageProvider {
  private client: OSS;

  constructor() {
    this.client = new OSS({
      region: config.storage.aliyun.region,
      accessKeyId: config.storage.aliyun.accessKeyId,
      accessKeySecret: config.storage.aliyun.accessKeySecret,
      bucket: config.storage.aliyun.bucket
    });
  }

  // 实现相同接口...
}

// Factory工厂类
export class StorageFactory {
  static create(): IStorageProvider {
    const provider = process.env.STORAGE_PROVIDER || 'minio';
    if (provider === 'minio') return new MinIOProvider();
    if (provider === 'aliyun') return new AliyunOSSProvider();
    if (provider === 'tencent') return new TencentCOSProvider();
    throw new Error(`Unknown storage provider: ${provider}`);
  }

  // 自动Fallback
  static async uploadWithFallback(file: Buffer, key: string): Promise<UploadResult> {
    const providers = [
      new MinIOProvider(),
      new AliyunOSSProvider()
    ];

    for (const provider of providers) {
      try {
        return await provider.upload(file, key);
      } catch (error) {
        logger.warn(`Storage provider ${provider.constructor.name} failed`, error);
      }
    }
    throw new Error('All storage providers failed');
  }
}
```

---

#### 2. TTS Adapter(语音合成服务)

**接口定义:**
```typescript
// src/services/tts/ITTSProvider.ts
export interface ITTSProvider {
  synthesize(request: TTSSynthesizeRequest): Promise<TTSSynthesizeResponse>;
  getAvailableVoices(): Promise<Voice[]>;
  healthCheck(): Promise<boolean>;
}

interface TTSSynthesizeRequest {
  text: string;
  voiceId: string;
  config: {
    speed?: number;   // 音速 0.5-2.0
    pitch?: number;   // 音调 -5 to +5
    volume?: number;  // 音量 0-10
    emotion?: string; // 情感标签
  };
}

interface TTSSynthesizeResponse {
  audioBuffer: Buffer;  // 音频数据
  duration: number;     // 时长(秒)
  format: string;       // 格式(mp3/wav)
  cost: number;         // 成本(元)
}
```

**实现:**
```typescript
// Coqui TTS Provider(主)
export class CoquiTTSProvider implements ITTSProvider {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.COQUI_TTS_URL || 'http://tts-server:5002';
  }

  async synthesize(request: TTSSynthesizeRequest): Promise<TTSSynthesizeResponse> {
    // 调用Coqui TTS Server HTTP API
    const response = await axios.post(`${this.baseUrl}/api/tts`, {
      text: request.text,
      speaker_id: request.voiceId,
      speed: request.config.speed || 1.0
    }, { responseType: 'arraybuffer' });

    return {
      audioBuffer: Buffer.from(response.data),
      duration: 0, // Coqui不返回时长,需ffmpeg计算
      format: 'wav',
      cost: 0 // 自部署无成本
    };
  }

  async getAvailableVoices(): Promise<Voice[]> {
    const response = await axios.get(`${this.baseUrl}/api/voices`);
    return response.data.voices;
  }

  async healthCheck(): Promise<boolean> {
    try {
      await axios.get(`${this.baseUrl}/health`, { timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }
}

// 百度TTS Provider(备)
export class BaiduTTSProvider implements ITTSProvider {
  private client: BaiduTTSClient;

  constructor() {
    this.client = new BaiduTTSClient({
      apiKey: config.tts.baidu.apiKey,
      secretKey: config.tts.baidu.secretKey
    });
  }

  async synthesize(request: TTSSynthesizeRequest): Promise<TTSSynthesizeResponse> {
    const result = await this.client.synthesize({
      text: request.text,
      per: this.mapVoiceId(request.voiceId),
      spd: Math.round(request.config.speed! * 5), // 映射到百度的1-9
      pit: request.config.pitch || 5,
      vol: request.config.volume || 5
    });

    return {
      audioBuffer: result.data,
      duration: result.duration,
      format: 'mp3',
      cost: (request.text.length / 1000) * 0.15 // ¥0.15/千字
    };
  }

  private mapVoiceId(voiceId: string): number {
    // 映射通用voice_id到百度的per
    const mapping: Record<string, number> = {
      'voice_male_1': 1,
      'voice_female_1': 0,
      'narrator_001': 4
    };
    return mapping[voiceId] || 1;
  }

  // 实现其他方法...
}

// Factory工厂类
export class TTSFactory {
  static create(): ITTSProvider {
    const provider = process.env.TTS_PROVIDER || 'coqui';
    if (provider === 'coqui') return new CoquiTTSProvider();
    if (provider === 'baidu') return new BaiduTTSProvider();
    if (provider === 'xunfei') return new XunfeiTTSProvider();
    throw new Error(`Unknown TTS provider: ${provider}`);
  }

  // 自动Fallback
  static async synthesizeWithFallback(request: TTSSynthesizeRequest): Promise<TTSSynthesizeResponse> {
    const primary = this.create();
    try {
      return await primary.synthesize(request);
    } catch (error) {
      logger.warn('Primary TTS failed, fallback to Baidu', error);
      const fallback = new BaiduTTSProvider();
      return await fallback.synthesize(request);
    }
  }
}
```

---

#### 3. NLP Adapter(自然语言处理服务)

**接口定义:**
```typescript
// src/services/nlp/INLPProvider.ts
export interface INLPProvider {
  recognizeCharacters(request: CharacterRecognitionRequest): Promise<CharacterRecognitionResponse>;
  healthCheck(): Promise<boolean>;
  getModelInfo(): { name: string; version: string; maxTokens: number };
}

interface CharacterRecognitionRequest {
  text: string;
  projectId: string;
}

interface CharacterRecognitionResponse {
  characters: Array<{
    name: string;
    gender: 'male' | 'female' | 'unknown';
    importance: '主角' | '配角' | '旁白';
    aliases: string[];
    dialogueCount: number;
  }>;
  confidence: number;
  tokensUsed: number;
  cost: number;
}
```

**实现:**
```typescript
// Deepseek Provider(主)
export class DeepseekProvider implements INLPProvider {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: 'https://api.deepseek.com'
    });
  }

  async recognizeCharacters(request: CharacterRecognitionRequest): Promise<CharacterRecognitionResponse> {
    const completion = await this.client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: this.getSystemPrompt() },
        { role: 'user', content: request.text }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3
    });

    const result = JSON.parse(completion.choices[0].message.content!);
    const tokensUsed = completion.usage!.total_tokens;

    return {
      characters: result.characters,
      confidence: 0.9,
      tokensUsed,
      cost: (tokensUsed / 1000) * 0.001 // ¥0.001/千token
    };
  }

  private getSystemPrompt(): string {
    return `你是小说角色识别专家。分析文本,识别所有角色、性别、重要性、别名。
输出JSON格式:
{
  "characters": [
    {"name": "张三", "gender": "male", "importance": "主角", "aliases": ["小张"], "dialogueCount": 50}
  ]
}`;
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.chat.completions.create({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 5
      });
      return true;
    } catch {
      return false;
    }
  }

  getModelInfo() {
    return { name: 'Deepseek', version: 'deepseek-chat', maxTokens: 32000 };
  }
}

// Qwen Provider(备)
export class QwenProvider implements INLPProvider {
  private client: OpenAI; // Qwen API兼容OpenAI

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.QWEN_API_KEY,
      baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
    });
  }

  // 实现相同接口...
}

// OpenAI Provider(备)
export class OpenAIProvider implements INLPProvider {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  // 实现相同接口...
}

// Factory工厂类
export class NLPFactory {
  static create(): INLPProvider {
    const provider = process.env.NLP_PROVIDER || 'deepseek';
    if (provider === 'deepseek') return new DeepseekProvider();
    if (provider === 'qwen') return new QwenProvider();
    if (provider === 'openai') return new OpenAIProvider();
    throw new Error(`Unknown NLP provider: ${provider}`);
  }

  // 多级Fallback
  static async recognizeWithFallback(request: CharacterRecognitionRequest): Promise<CharacterRecognitionResponse> {
    const providers = [
      new DeepseekProvider(),
      new QwenProvider(),
      new OpenAIProvider()
    ];

    for (const provider of providers) {
      try {
        return await provider.recognizeCharacters(request);
      } catch (error) {
        logger.warn(`NLP provider ${provider.constructor.name} failed`, error);
      }
    }
    throw new Error('All NLP providers failed');
  }
}
```

---

### 配置管理

**环境变量配置:**
```bash
# .env
# 服务提供商选择
STORAGE_PROVIDER=minio      # minio | aliyun | tencent
TTS_PROVIDER=coqui          # coqui | baidu | xunfei
NLP_PROVIDER=deepseek       # deepseek | qwen | openai

# MinIO配置
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=smartvoice

# Coqui TTS配置
COQUI_TTS_URL=http://tts-server:5002

# Deepseek配置
DEEPSEEK_API_KEY=sk-xxx

# 备用服务配置
ALIYUN_OSS_REGION=oss-cn-hangzhou
ALIYUN_OSS_ACCESS_KEY_ID=xxx
ALIYUN_OSS_ACCESS_KEY_SECRET=xxx
ALIYUN_OSS_BUCKET=smartvoice

BAIDU_TTS_API_KEY=xxx
BAIDU_TTS_SECRET_KEY=xxx

QWEN_API_KEY=xxx
OPENAI_API_KEY=xxx
```

**配置加载:**
```typescript
// src/config/index.ts
export default {
  storage: {
    provider: process.env.STORAGE_PROVIDER || 'minio',
    minio: {
      endpoint: process.env.MINIO_ENDPOINT!,
      port: parseInt(process.env.MINIO_PORT || '9000'),
      accessKey: process.env.MINIO_ACCESS_KEY!,
      secretKey: process.env.MINIO_SECRET_KEY!,
      bucket: process.env.MINIO_BUCKET || 'smartvoice',
      useSSL: false
    },
    aliyun: {
      region: process.env.ALIYUN_OSS_REGION,
      accessKeyId: process.env.ALIYUN_OSS_ACCESS_KEY_ID,
      accessKeySecret: process.env.ALIYUN_OSS_ACCESS_KEY_SECRET,
      bucket: process.env.ALIYUN_OSS_BUCKET,
      cdnDomain: process.env.ALIYUN_CDN_DOMAIN
    }
  },
  tts: {
    provider: process.env.TTS_PROVIDER || 'coqui',
    coqui: {
      baseUrl: process.env.COQUI_TTS_URL || 'http://tts-server:5002'
    },
    baidu: {
      apiKey: process.env.BAIDU_TTS_API_KEY,
      secretKey: process.env.BAIDU_TTS_SECRET_KEY
    }
  },
  nlp: {
    provider: process.env.NLP_PROVIDER || 'deepseek',
    deepseek: {
      apiKey: process.env.DEEPSEEK_API_KEY
    },
    qwen: {
      apiKey: process.env.QWEN_API_KEY
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL,
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini'
    }
  }
};
```

---

### 使用示例

**在业务代码中使用:**
```typescript
// src/services/project/ProjectService.ts
import { StorageFactory } from '@/services/storage';
import { NLPFactory } from '@/services/nlp';
import { TTSFactory } from '@/services/tts';

export class ProjectService {
  private storage = StorageFactory.create();
  private nlp = NLPFactory.create();
  private tts = TTSFactory.create();

  // 上传文件
  async uploadFile(file: Buffer, filename: string) {
    // 业务代码不关心是MinIO还是OSS
    const result = await this.storage.upload(file, `projects/${uuid()}/${filename}`);
    return result.url;
  }

  // 识别角色(带Fallback)
  async recognizeCharacters(projectId: string, text: string) {
    // 自动Fallback到备用服务
    const result = await NLPFactory.recognizeWithFallback({ text, projectId });
    return result.characters;
  }

  // 生成音频(带Fallback)
  async generateAudio(text: string, voiceId: string, config: any) {
    // 自动Fallback到备用服务
    const result = await TTSFactory.synthesizeWithFallback({ text, voiceId, config });

    // 上传音频
    const audioUrl = await this.storage.upload(result.audioBuffer, `audio/${uuid()}.mp3`);
    return { audioUrl, cost: result.cost };
  }
}
```

---

### 优势总结

1. **灵活切换** - 修改环境变量即可切换服务商,无需改代码
2. **成本优化** - MVP使用自部署,成长期切换到云服务,平滑过渡
3. **高可用** - 自动Fallback机制,主服务故障自动切换备用
4. **易于测试** - 可实现Mock Provider用于单元测试
5. **零业务侵入** - 业务代码不关心底层实现,只关注接口

---

## 🧩 核心模块设计

### 模块 1: 用户模块 (UserService)

**职责:**
- 用户注册、登录、认证
- 用户信息管理
- 会员权益管理

**核心功能:**
1. **用户注册**
   - 邮箱注册(MVP)
   - 手机号注册(P1)
   - 密码强度校验
   - 邮箱验证(发送验证链接)

2. **用户登录**
   - 邮箱/手机号 + 密码登录
   - JWT Token生成(有效期7天)
   - Refresh Token机制

3. **会员管理**
   - 免费用户:每月1个项目额度
   - 付费用户:无限项目(V1.0)

**技术实现:**
- **认证:** JWT + Redis缓存Token
- **密码:** bcrypt加密(成本因子10)
- **Session:** 可选Redis存储(或无状态JWT)

**数据表:**
```sql
-- users 用户表
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100),
  avatar_url TEXT,
  subscription_tier VARCHAR(50) DEFAULT 'free', -- free/pro
  quota_remaining INT DEFAULT 1, -- 剩余项目额度
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
```

**API端点:**
- `POST /api/v1/auth/register` - 用户注册
- `POST /api/v1/auth/login` - 用户登录
- `GET /api/v1/users/me` - 获取当前用户
- `PUT /api/v1/users/me` - 更新用户信息
- `POST /api/v1/auth/refresh` - 刷新Token

---

### 模块 2: 项目管理模块 (ProjectService)

**职责:**
- 项目创建和管理
- 文件上传
- 项目列表和详情查询

**核心功能:**
1. **项目创建**
   - 上传txt文件(≤10MB)
   - 生成项目ID
   - 触发文本解析任务

2. **项目管理**
   - 项目列表(分页)
   - 项目详情(章节、角色、音频)
   - 项目删除(软删除)

**技术实现:**
- **文件上传:** Multer中间件 + 流式上传到OSS
- **文件验证:** 格式检查(txt)、大小限制(10MB)
- **异步处理:** 上传后触发解析任务(通过Bull队列)

**数据表:**
```sql
-- projects 项目表
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  source_file_url TEXT NOT NULL, -- OSS URL
  file_size_bytes BIGINT,
  word_count INT,
  status VARCHAR(50) DEFAULT 'uploading', -- uploading/parsing/parsed/generating/completed/failed
  progress INT DEFAULT 0, -- 0-100
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP -- 软删除
);

CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
```

**API端点:**
- `POST /api/v1/projects` - 创建项目(上传文件)
- `GET /api/v1/projects` - 获取项目列表
- `GET /api/v1/projects/:id` - 获取项目详情
- `DELETE /api/v1/projects/:id` - 删除项目

---

### 模块 3: 文本解析模块 (ParserService)

**职责:**
- 解析txt文本结构
- 章节识别
- 段落和对话分割

**核心功能:**
1. **章节识别**
   - 基于标题规则(如"第一章"、"Chapter 1")
   - 基于空行分隔
   - 支持无章节文本(单章节处理)

2. **段落分割**
   - 按换行符分割
   - 识别对话和旁白

3. **对话标记识别**
   - 识别引号("", '', 「」)
   - 识别冒号("XX说:")
   - 识别破折号(——)

**技术实现:**
- **解析引擎:** 自研(基于正则表达式)
- **异步处理:** Bull队列 + Worker进程
- **进度推送:** WebSocket推送解析进度

**数据表:**
```sql
-- chapters 章节表
CREATE TABLE chapters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  chapter_number INT NOT NULL,
  title VARCHAR(255),
  content TEXT NOT NULL, -- 原始文本
  word_count INT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_chapters_project_id ON chapters(project_id);

-- paragraphs 段落表(用于TTS生成)
CREATE TABLE paragraphs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  sequence_number INT NOT NULL, -- 段落顺序
  content TEXT NOT NULL,
  type VARCHAR(20), -- dialogue/narration
  character_id UUID REFERENCES characters(id), -- 说话者(如果是对话)
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_paragraphs_chapter_id ON paragraphs(chapter_id);
```

**处理流程:**
```
1. 从OSS读取txt文件
2. 章节识别 → 写入chapters表
3. 段落分割 → 写入paragraphs表
4. 更新project状态为'parsed'
5. WebSocket推送完成通知
```

---

### 模块 4: 角色识别模块 (CharacterService)

**职责:**
- 智能识别文本中的角色
- 对话归属分析
- 角色属性推断(性别、重要性)
- 自动音色分配

**核心功能:**
1. **角色实体识别**
   - 调用OpenAI GPT-4o-mini API
   - Prompt Engineering提取角色列表
   - 角色去重和聚类(处理别名)

2. **对话归属**
   - 将paragraphs中的对话分配给角色
   - 推断隐含的说话者(如"他说")

3. **性别推断**
   - 基于名字推断(如"张三"→男,"李丽"→女)
   - 基于对话内容推断(GPT分析)

4. **自动音色分配**
   - 男性角色 → 男声音色
   - 女性角色 → 女声音色
   - 旁白 → 中性音色
   - 区分度优化(主角用音色1,配角用音色2)

**技术实现:**
- **NLP模型:** OpenAI GPT-4o-mini API
- **Prompt示例:**
```
你是小说角色识别专家。分析以下文本,识别所有角色、性别、重要性。

输出JSON:
{
  "characters": [
    {"name": "张三", "gender": "male", "importance": "主角", "aliases": ["小张", "阿三"]},
    {"name": "李四", "gender": "female", "importance": "配角", "aliases": []}
  ]
}

文本: [章节内容]
```

- **音色分配规则:**
```javascript
function assignVoice(character) {
  if (character.type === 'narrator') return 'voice_narrator';
  if (character.gender === 'male') {
    return character.importance === '主角' ? 'voice_male_1' : 'voice_male_2';
  }
  if (character.gender === 'female') {
    return character.importance === '主角' ? 'voice_female_1' : 'voice_female_2';
  }
  return 'voice_neutral';
}
```

**数据表:**
```sql
-- characters 角色表
CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  gender VARCHAR(20), -- male/female/unknown
  importance VARCHAR(50), -- 主角/配角/旁白
  dialogue_count INT DEFAULT 0, -- 对话数量
  voice_id VARCHAR(50), -- 百度TTS音色ID
  voice_config JSONB, -- {speed: 1.0, pitch: 0, volume: 5, emotion: "neutral"}
  aliases TEXT[], -- 别名数组
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_characters_project_id ON characters(project_id);

-- 更新paragraphs表的character_id外键
ALTER TABLE paragraphs ADD CONSTRAINT fk_character
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE SET NULL;
```

**API端点:**
- `GET /api/v1/projects/:id/characters` - 获取角色列表
- `PUT /api/v1/characters/:id` - 更新角色配置(音色、参数)
- `POST /api/v1/characters/:id/preview` - 音色预览(生成50字试听)
- `POST /api/v1/projects/:id/recognize` - 触发角色识别

---

### 模块 5: TTS 生成模块 (TTSService)

**职责:**
- 调用百度TTS API
- 音频批量生成
- 音频拼接
- 任务队列管理

**核心功能:**
1. **音色预览**
   - 选择角色的一段对话(50-100字)
   - 调用百度TTS API生成音频
   - 返回临时音频URL
   - 缓存预览音频(Redis,有效期1小时)

2. **批量章节生成**
   - 用户选择章节 → 创建生成任务
   - 任务加入Bull队列
   - Worker异步处理:
     - 读取章节的所有paragraphs
     - 按顺序调用百度TTS API(并发控制)
     - 下载音频片段到临时目录
     - ffmpeg拼接音频
     - 上传完整音频到OSS
     - 更新任务状态
   - WebSocket推送实时进度

3. **音频缓存**
   - Key: `audio:{text_hash}:{voice_id}:{params_hash}`
   - Value: OSS URL
   - 有效期:30天
   - 相同文本+音色+参数直接返回缓存

4. **成本优化**
   - 批量API调用(减少请求次数)
   - 并发控制(10个并发,避免API限流)
   - 缓存策略(节省30-50%成本)

**技术实现:**
- **TTS API:** 百度智能云语音合成
- **任务队列:** Bull + Redis
- **音频处理:** fluent-ffmpeg (Node.js封装)
- **并发控制:** p-limit库(限制并发数)

**代码示例(TTS调用):**
```javascript
// 百度TTS调用
async function callBaiduTTS(text, voiceId, config) {
  const cacheKey = `audio:${hashText(text)}:${voiceId}:${hashConfig(config)}`;

  // 检查缓存
  const cachedUrl = await redis.get(cacheKey);
  if (cachedUrl) return cachedUrl;

  // 调用百度TTS API
  const response = await baiduTTSClient.synthesize({
    text,
    spd: config.speed, // 音速
    pit: config.pitch, // 音调
    vol: config.volume, // 音量
    per: voiceId // 音色
  });

  // 上传音频到OSS
  const audioUrl = await uploadToOSS(response.audioData, `audio/${uuid()}.mp3`);

  // 缓存30天
  await redis.setex(cacheKey, 30 * 24 * 3600, audioUrl);

  return audioUrl;
}

// ffmpeg拼接音频
async function concatAudios(audioUrls, outputPath) {
  const ffmpeg = require('fluent-ffmpeg');

  return new Promise((resolve, reject) => {
    let command = ffmpeg();

    // 添加所有音频文件
    audioUrls.forEach(url => command.input(url));

    // 拼接并输出
    command
      .on('end', () => resolve(outputPath))
      .on('error', reject)
      .mergeToFile(outputPath, '/tmp/');
  });
}
```

**数据表:**
```sql
-- tts_tasks TTS任务表
CREATE TABLE tts_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  chapter_ids UUID[] NOT NULL, -- 选中的章节ID数组
  status VARCHAR(50) DEFAULT 'pending', -- pending/processing/completed/failed
  progress INT DEFAULT 0, -- 0-100
  current_chapter_id UUID,
  error_message TEXT,
  estimated_cost DECIMAL(10, 2), -- 预估成本
  actual_cost DECIMAL(10, 2), -- 实际成本
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE INDEX idx_tts_tasks_project_id ON tts_tasks(project_id);
CREATE INDEX idx_tts_tasks_status ON tts_tasks(status);
```

**Worker处理流程:**
```
1. 从Redis Queue获取任务
2. 读取chapter_ids对应的所有paragraphs
3. 按sequence_number排序
4. 遍历paragraphs:
   - 查询character的voice_config
   - 调用callBaiduTTS()生成音频
   - 更新进度 → WebSocket推送
5. 所有音频生成完成 → ffmpeg拼接
6. 上传完整音频到OSS
7. 更新任务状态为'completed'
8. WebSocket推送完成通知
```

**API端点:**
- `POST /api/v1/projects/:id/generate` - 创建生成任务
- `GET /api/v1/tasks/:id` - 获取任务详情
- `GET /api/v1/tasks/:id/progress` - 获取实时进度
- `DELETE /api/v1/tasks/:id` - 取消任务

---

### 模块 6: 音频管理模块 (AudioService)

**职责:**
- 音频文件元数据管理
- 音频播放服务
- 音频下载链接生成
- 音频删除和清理

**核心功能:**
1. **音频列表**
   - 查询项目的所有已生成音频
   - 显示章节名、时长、文件大小、生成时间

2. **在线播放**
   - 返回CDN加速的音频URL
   - 支持Range请求(拖动播放进度)

3. **下载服务**
   - 生成带签名的临时下载链接(有效期7天)
   - 文件名:项目名-章节名.mp3

4. **音频清理**
   - 定时任务:删除7天前的音频(节省存储成本)
   - 用户主动删除

**技术实现:**
- **存储:** 阿里云OSS
- **CDN:** 阿里云CDN加速
- **签名URL:** OSS SDK生成临时签名链接

**数据表:**
```sql
-- audio_files 音频文件表
CREATE TABLE audio_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES chapters(id) ON DELETE SET NULL,
  filename VARCHAR(255) NOT NULL,
  oss_url TEXT NOT NULL, -- OSS原始URL
  cdn_url TEXT NOT NULL, -- CDN加速URL
  file_size_bytes BIGINT,
  duration_seconds INT, -- 音频时长
  format VARCHAR(20) DEFAULT 'mp3',
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '7 days' -- 7天后过期
);

CREATE INDEX idx_audio_files_project_id ON audio_files(project_id);
CREATE INDEX idx_audio_files_expires_at ON audio_files(expires_at);
```

**API端点:**
- `GET /api/v1/projects/:id/audios` - 获取音频列表
- `GET /api/v1/audios/:id/play` - 获取播放URL(CDN)
- `GET /api/v1/audios/:id/download` - 获取下载URL(签名)
- `DELETE /api/v1/audios/:id` - 删除音频

---

### 模块 7: 通知服务模块 (NotificationService)

**职责:**
- 实时进度推送(WebSocket)
- 任务完成通知

**核心功能:**
1. **WebSocket连接管理**
   - 用户连接时保存Socket ID映射
   - 断线重连机制

2. **进度推送**
   - 解析进度(文本解析中)
   - 识别进度(角色识别中)
   - 生成进度(TTS生成中,百分比)

3. **完成通知**
   - 项目解析完成
   - 角色识别完成
   - 音频生成完成

**技术实现:**
- **WebSocket:** Socket.io
- **推送逻辑:** Worker进程通过Redis Pub/Sub通知API服务 → API服务通过Socket.io推送给前端

**代码示例:**
```javascript
// Worker进程(生成音频时)
async function notifyProgress(taskId, progress) {
  await redis.publish('tts:progress', JSON.stringify({
    taskId,
    progress,
    timestamp: Date.now()
  }));
}

// API服务(订阅Redis)
redis.subscribe('tts:progress');
redis.on('message', (channel, message) => {
  const data = JSON.parse(message);
  const userId = await getUserIdByTaskId(data.taskId);

  // 推送给对应用户的Socket连接
  io.to(userId).emit('task:progress', data);
});
```

---

## 🔄 核心流程设计

### 流程 1: 项目创建到角色识别

```
┌────────┐
│用户上传文件│
└────┬───┘
     │
     ▼
┌────────────────┐
│文件验证         │ ← 前端:格式检查(txt)、大小(≤10MB)
│- 格式检查       │ ← 后端:二次验证
│- 大小限制       │
└────┬───────────┘
     │
     ▼
┌────────────────┐
│上传到OSS        │ ← Multer流式上传
│- 生成文件URL    │ ← 返回OSS URL
└────┬───────────┘
     │
     ▼
┌────────────────┐
│创建项目记录     │ ← 写入projects表,status='uploading'
└────┬───────────┘
     │
     ▼
┌────────────────┐
│触发解析任务     │ ← 加入Bull队列
│- 加入队列       │
└────┬───────────┘
     │
     ▼
┌────────────────────────────┐
│Worker异步处理               │
│1. 从OSS读取文件             │
│2. 章节识别 → chapters表     │
│3. 段落分割 → paragraphs表   │
│4. 更新status='parsed'       │
│5. WebSocket推送完成         │
└────┬───────────────────────┘
     │
     ▼
┌────────────────┐
│触发角色识别     │ ← 自动或用户手动触发
│- 调用GPT API    │
└────┬───────────┘
     │
     ▼
┌────────────────────────────┐
│角色识别处理                 │
│1. GPT分析文本 → 角色列表    │
│2. 对话归属                  │
│3. 性别推断                  │
│4. 自动音色分配              │
│5. 写入characters表          │
│6. WebSocket推送完成         │
└────┬───────────────────────┘
     │
     ▼
┌────────────────┐
│展示结果给用户   │ ← 前端展示角色列表、音色配置
│- 角色列表       │
│- 默认音色       │
│- 可调整配置     │
└────────────────┘
```

**关键技术点:**
- **异步处理** - 大文件解析耗时长,必须异步处理
- **进度推送** - WebSocket实时推送进度,提升用户体验
- **错误处理** - 任务失败重试3次,记录error_message
- **性能优化** - 文本分块处理,避免内存溢出

---

### 流程 2: 批量音频生成

```
┌────────────────┐
│用户选择章节     │ ← 前端:多选章节
│点击"生成音频"  │
└────┬───────────┘
     │
     ▼
┌────────────────┐
│创建生成任务     │ ← 写入tts_tasks表,status='pending'
│- 计算预估成本   │ ← 字数 × ¥0.15/千字
│- 返回任务ID     │
└────┬───────────┘
     │
     ▼
┌────────────────┐
│加入任务队列     │ ← Bull队列,优先级FIFO
└────┬───────────┘
     │
     ▼
┌─────────────────────────────────────────────────┐
│Worker异步处理(可并发10个任务)                   │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │1. 从队列获取任务                          │  │
│  │   - 更新status='processing'               │  │
│  └──────────────────────────────────────────┘  │
│                  │                               │
│                  ▼                               │
│  ┌──────────────────────────────────────────┐  │
│  │2. 读取章节内容                            │  │
│  │   - 查询paragraphs(按sequence_number排序) │  │
│  └──────────────────────────────────────────┘  │
│                  │                               │
│                  ▼                               │
│  ┌──────────────────────────────────────────┐  │
│  │3. 遍历段落,逐个调用TTS                    │  │
│  │   ┌─────────────────────────────┐        │  │
│  │   │for each paragraph:          │        │  │
│  │   │  - 查询character.voice_config│        │  │
│  │   │  - 检查Redis缓存             │        │  │
│  │   │  - 调用百度TTS API           │        │  │
│  │   │  - 下载音频片段到/tmp        │        │  │
│  │   │  - 更新进度 → WebSocket推送  │        │  │
│  │   └─────────────────────────────┘        │  │
│  │   (并发控制:10个API请求并发)              │  │
│  └──────────────────────────────────────────┘  │
│                  │                               │
│                  ▼                               │
│  ┌──────────────────────────────────────────┐  │
│  │4. ffmpeg拼接音频                          │  │
│  │   - 按顺序拼接所有片段                    │  │
│  │   - 生成完整MP3文件                       │  │
│  └──────────────────────────────────────────┘  │
│                  │                               │
│                  ▼                               │
│  ┌──────────────────────────────────────────┐  │
│  │5. 上传到OSS                               │  │
│  │   - 上传完整音频文件                      │  │
│  │   - 获取OSS URL和CDN URL                  │  │
│  └──────────────────────────────────────────┘  │
│                  │                               │
│                  ▼                               │
│  ┌──────────────────────────────────────────┐  │
│  │6. 更新任务状态                            │  │
│  │   - 写入audio_files表                     │  │
│  │   - 更新tts_tasks.status='completed'      │  │
│  │   - 记录实际成本                          │  │
│  └──────────────────────────────────────────┘  │
│                  │                               │
│                  ▼                               │
│  ┌──────────────────────────────────────────┐  │
│  │7. WebSocket推送完成通知                   │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
└─────────────────────────────────────────────────┘
     │
     ▼
┌────────────────┐
│用户查看音频     │ ← 前端显示音频列表
│- 在线试听       │ ← CDN加速播放
│- 下载文件       │ ← 临时签名URL
└────────────────┘
```

**关键技术点:**
- **并发控制** - 使用p-limit限制同时调用10个TTS API,避免限流
- **音频缓存** - Redis缓存相同文本+音色的音频,节省30-50%成本
- **断点续传** - 任务失败时记录已生成的段落,重启时跳过
- **成本统计** - 记录每次API调用成本,用于成本分析

**性能预估:**
- 单章节(1万字):约1分钟
- 10个章节并发生成:约10分钟
- 瓶颈:百度TTS API响应时间(1-2秒/次)

---

## 💾 数据库设计

### 数据库选择

**主数据库:** PostgreSQL 14

**理由:**
- 数据结构清晰(用户-项目-章节-角色-音频),关系型数据库最适合
- JSONB支持好(voice_config、aliases等JSON字段)
- 事务支持强,保证数据一致性
- 团队熟悉度高

**缓存:** Redis 7
- Session存储
- 音频缓存(Key: `audio:{hash}`, Value: OSS URL)
- Bull任务队列
- API限流计数器

---

### ER图

```
┌─────────────┐
│    users    │
│ (用户表)    │
└──────┬──────┘
       │ 1
       │
       │ N
┌──────▼──────────┐          ┌─────────────────┐
│    projects     │          │  tts_tasks      │
│   (项目表)      │◄─────────│  (生成任务表)   │
└──────┬──────────┘ 1      N └─────────────────┘
       │ 1
       │
       │ N
┌──────▼──────────┐          ┌─────────────────┐
│    chapters     │ 1      N │  audio_files    │
│   (章节表)      │◄─────────│  (音频文件表)   │
└──────┬──────────┘          └─────────────────┘
       │ 1
       │
       │ N
┌──────▼──────────┐
│   paragraphs    │
│   (段落表)      │
└──────┬──────────┘
       │ N
       │
       │ 1
┌──────▼──────────┐
│   characters    │
│   (角色表)      │
└─────────────────┘
```

**核心数据表已在各模块中详细定义,完整数据库设计请参考:** [database-design.md](database-design.md)

---

## 🌐 API 设计

### API 架构风格

**选择:** RESTful API

**认证方式:** JWT Bearer Token

**API版本:** `/api/v1`

**响应格式:**
```json
{
  "success": true,
  "data": { ... },
  "message": "操作成功",
  "timestamp": 1674123456789
}

// 错误响应
{
  "success": false,
  "error": {
    "code": "INVALID_FILE_FORMAT",
    "message": "仅支持txt格式文件"
  },
  "timestamp": 1674123456789
}
```

### 核心 API 端点

**详细API设计请参考:** [api-design.md](api-design.md)

**API端点汇总:**

| 模块 | 方法 | 端点 | 描述 |
|------|------|------|------|
| **认证** | POST | /api/v1/auth/register | 用户注册 |
| | POST | /api/v1/auth/login | 用户登录 |
| | POST | /api/v1/auth/refresh | 刷新Token |
| **用户** | GET | /api/v1/users/me | 获取当前用户 |
| | PUT | /api/v1/users/me | 更新用户信息 |
| **项目** | POST | /api/v1/projects | 创建项目(上传文件) |
| | GET | /api/v1/projects | 获取项目列表 |
| | GET | /api/v1/projects/:id | 获取项目详情 |
| | DELETE | /api/v1/projects/:id | 删除项目 |
| **角色** | GET | /api/v1/projects/:id/characters | 获取角色列表 |
| | PUT | /api/v1/characters/:id | 更新角色配置 |
| | POST | /api/v1/characters/:id/preview | 音色预览 |
| **生成** | POST | /api/v1/projects/:id/generate | 创建生成任务 |
| | GET | /api/v1/tasks/:id | 获取任务详情 |
| | DELETE | /api/v1/tasks/:id | 取消任务 |
| **音频** | GET | /api/v1/projects/:id/audios | 获取音频列表 |
| | GET | /api/v1/audios/:id/play | 获取播放URL |
| | GET | /api/v1/audios/:id/download | 获取下载URL |
| | DELETE | /api/v1/audios/:id | 删除音频 |

---

## 📦 部署架构

### MVP阶段部署方案

**环境:**
- 开发环境(Dev):本地开发
- 生产环境(Production):阿里云

**部署方式:** 传统虚拟机 + Docker

**理由:**
- Kubernetes过于复杂,不适合2人团队和MVP阶段
- Docker容器化,方便后续迁移
- 单服务器成本低(¥1,200/年)

### 生产环境架构

```
                Internet
                    │
                    ▼
        ┌───────────────────────┐
        │  阿里云CDN             │ ← 静态资源、音频文件加速
        │  - 全国加速节点        │
        └───────┬───────────────┘
                │
                ▼
        ┌───────────────────────┐
        │  Nginx (负载均衡)      │ ← 反向代理、HTTPS、限流
        │  - SSL证书             │
        │  - Rate Limit          │
        └───────┬───────────────┘
                │
                ▼
        ┌───────────────────────┐
        │  阿里云ECS (2核4G)     │ ← 单服务器部署
        │                        │
        │  ┌─────────────────┐  │
        │  │ Docker Compose  │  │
        │  │ ┌────────────┐  │  │
        │  │ │ API Server │  │  │ ← Node.js Express
        │  │ │ (Container)│  │  │
        │  │ └────────────┘  │  │
        │  │ ┌────────────┐  │  │
        │  │ │   Worker   │  │  │ ← TTS Worker
        │  │ │ (Container)│  │  │
        │  │ └────────────┘  │  │
        │  │ ┌────────────┐  │  │
        │  │ │ PostgreSQL │  │  │ ← 数据库
        │  │ │ (Container)│  │  │
        │  │ └────────────┘  │  │
        │  │ ┌────────────┐  │  │
        │  │ │   Redis    │  │  │ ← 缓存+队列
        │  │ │ (Container)│  │  │
        │  │ └────────────┘  │  │
        │  └─────────────────┘  │
        └───────┬───────────────┘
                │
                ▼
        ┌───────────────────────┐
        │  阿里云OSS             │ ← 文件存储
        │  - txt文件上传         │
        │  - 音频文件存储        │
        └───────────────────────┘
                │
                ▼
        ┌───────────────────────┐
        │  第三方服务            │
        │  - 百度TTS API         │
        │  - OpenAI GPT API      │
        └───────────────────────┘
```

### Docker Compose 配置示例

```yaml
version: '3.8'

services:
  # Nginx反向代理
  nginx:
    image: nginx:alpine
    container_name: smartvoice-nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - api

  # API服务
  api:
    image: smartvoice/api:latest
    container_name: smartvoice-api
    restart: always
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://smartvoice:${DB_PASSWORD}@postgres:5432/smartvoice
      REDIS_URL: redis://redis:6379
      # 服务提供商配置
      STORAGE_PROVIDER: minio
      TTS_PROVIDER: coqui
      NLP_PROVIDER: deepseek
      # MinIO配置
      MINIO_ENDPOINT: minio
      MINIO_PORT: 9000
      MINIO_ACCESS_KEY: ${MINIO_ACCESS_KEY}
      MINIO_SECRET_KEY: ${MINIO_SECRET_KEY}
      MINIO_BUCKET: smartvoice
      # Coqui TTS配置
      COQUI_TTS_URL: http://tts-server:5002
      # Deepseek配置
      DEEPSEEK_API_KEY: ${DEEPSEEK_API_KEY}
      # 备用服务配置
      ALIYUN_OSS_REGION: ${ALIYUN_OSS_REGION}
      ALIYUN_OSS_ACCESS_KEY_ID: ${ALIYUN_OSS_ACCESS_KEY_ID}
      ALIYUN_OSS_ACCESS_KEY_SECRET: ${ALIYUN_OSS_ACCESS_KEY_SECRET}
      BAIDU_TTS_API_KEY: ${BAIDU_TTS_API_KEY}
      BAIDU_TTS_SECRET_KEY: ${BAIDU_TTS_SECRET_KEY}
      QWEN_API_KEY: ${QWEN_API_KEY}
    depends_on:
      - postgres
      - redis
      - minio
      - tts-server

  # Worker服务(TTS生成)
  worker:
    image: smartvoice/worker:latest
    container_name: smartvoice-worker
    restart: always
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://smartvoice:${DB_PASSWORD}@postgres:5432/smartvoice
      REDIS_URL: redis://redis:6379
      # 服务提供商配置(继承API配置)
      STORAGE_PROVIDER: minio
      TTS_PROVIDER: coqui
      NLP_PROVIDER: deepseek
      MINIO_ENDPOINT: minio
      MINIO_PORT: 9000
      MINIO_ACCESS_KEY: ${MINIO_ACCESS_KEY}
      MINIO_SECRET_KEY: ${MINIO_SECRET_KEY}
      COQUI_TTS_URL: http://tts-server:5002
    depends_on:
      - postgres
      - redis
      - minio
      - tts-server

  # PostgreSQL数据库
  postgres:
    image: postgres:14-alpine
    container_name: smartvoice-postgres
    restart: always
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: smartvoice
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: smartvoice
    volumes:
      - postgres_data:/var/lib/postgresql/data
    command: postgres -c shared_buffers=256MB -c max_connections=200

  # Redis缓存+队列
  redis:
    image: redis:7-alpine
    container_name: smartvoice-redis
    restart: always
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes --maxmemory 512mb --maxmemory-policy allkeys-lru

  # MinIO对象存储(S3兼容)
  minio:
    image: minio/minio:latest
    container_name: smartvoice-minio
    restart: always
    ports:
      - "9000:9000"  # API端口
      - "9001:9001"  # Web控制台
    environment:
      MINIO_ROOT_USER: ${MINIO_ACCESS_KEY}
      MINIO_ROOT_PASSWORD: ${MINIO_SECRET_KEY}
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3

  # Coqui TTS Server(GPU推理)
  tts-server:
    image: smartvoice/coqui-tts:latest
    container_name: smartvoice-tts
    restart: always
    ports:
      - "5002:5002"
    environment:
      TTS_MODEL: tts_models/zh-CN/baker/tacotron2-DDC-GST
      TTS_VOCODER: vocoder_models/universal/libri-tts/fullband-melgan
    volumes:
      - tts_models:/root/.local/share/tts  # 模型缓存
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5002/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres_data:
  redis_data:
  minio_data:
  tts_models:
```

**说明:**
- **minio** - S3兼容对象存储,替代阿里云OSS,零成本
- **tts-server** - Coqui TTS服务,GPU推理,替代百度TTS,边际成本¥0
- **环境变量** - 通过`.env`文件管理敏感配置
- **GPU支持** - `deploy.resources.reservations.devices`配置GPU
- **健康检查** - MinIO和TTS Server配置健康检查,确保服务可用
- **数据持久化** - 所有数据通过volumes持久化

**Docker Compose启动命令:**
```bash
# 创建.env文件
cat > .env <<EOF
DB_PASSWORD=your_secure_password
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin_password
DEEPSEEK_API_KEY=sk-xxx
ALIYUN_OSS_REGION=oss-cn-hangzhou
ALIYUN_OSS_ACCESS_KEY_ID=xxx
ALIYUN_OSS_ACCESS_KEY_SECRET=xxx
BAIDU_TTS_API_KEY=xxx
BAIDU_TTS_SECRET_KEY=xxx
QWEN_API_KEY=xxx
EOF

# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f api worker tts-server

# 创建MinIO Bucket
docker exec smartvoice-minio mc alias set myminio http://localhost:9000 minioadmin minioadmin_password
docker exec smartvoice-minio mc mb myminio/smartvoice

# 运行数据库迁移
docker exec smartvoice-api npm run prisma:migrate
```

### 扩展性考虑

**水平扩展(成长期):**
- API服务:增加服务器 + 负载均衡
- Worker服务:增加Worker服务器,共享Redis队列
- 数据库:读写分离(主从复制)

**垂直扩展(MVP阶段):**
- ECS升级配置:2核4G → 4核8G
- PostgreSQL增加内存
- Redis增加内存

**成本优化:**
- 按需扩展(监控CPU/内存,手动扩容)
- 定时任务(凌晨低峰期处理大批量任务)

---

## 🔒 安全设计

### 认证和鉴权

1. **JWT Token认证**
   - Access Token:有效期7天
   - Refresh Token:有效期30天
   - Token存储:前端LocalStorage

2. **API鉴权**
   - 所有需要登录的API验证JWT
   - 用户只能访问自己的项目和音频

3. **角色权限(V1.0)**
   - 普通用户:CRUD自己的项目
   - 管理员:查看所有用户、统计数据

### 数据安全

1. **密码安全**
   - bcrypt加密(成本因子10)
   - 密码强度校验(至少8位,含字母+数字)

2. **传输安全**
   - HTTPS加密(Let's Encrypt免费证书)
   - Cookie设置HttpOnly、Secure

3. **数据库安全**
   - 定期备份(每日凌晨自动备份)
   - 软删除(deleted_at字段,数据可恢复)

### API 安全

1. **请求限流**
   - 全局:1000次/分钟/IP
   - 单用户:100次/分钟
   - TTS生成:10个并发任务/用户

2. **输入验证**
   - Joi参数验证
   - 文件类型验证
   - SQL注入防护(Prisma ORM自动防护)

3. **CORS配置**
   - 仅允许前端域名跨域
   - 生产环境禁止*通配符

---

## 📊 监控和运维

### 监控指标

**系统指标(基础设施):**
- CPU使用率(告警阈值:>80%)
- 内存使用率(告警阈值:>80%)
- 磁盘使用率(告警阈值:>80%)
- 网络流量

**应用指标:**
- API响应时间P95(告警阈值:>1s)
- API错误率(告警阈值:>5%)
- 数据库连接数
- Redis内存使用

**业务指标:**
- 用户注册数(日/周/月)
- 项目创建数
- TTS任务成功率(目标>95%)
- 平均生成时长
- TTS成本统计

### 日志系统

**应用日志:**
- Winston日志库
- 日志级别:error/warn/info/debug
- 日志输出:文件 + 控制台
- 日志轮转:每天一个文件,保留7天

**错误追踪:**
- Sentry(V1.0阶段接入)
- 实时错误通知
- 错误堆栈追踪

**访问日志:**
- Nginx access.log
- 记录所有API请求

---

## 🎯 性能优化

### 前端优化

1. **代码分割**
   - React Lazy + Suspense
   - 路由级别代码分割
   - 减少首屏加载时间

2. **资源优化**
   - CDN加速静态资源
   - 图片懒加载
   - Gzip压缩

3. **缓存策略**
   - 静态资源缓存(Cache-Control: max-age=31536000)
   - API响应缓存(SWR策略)

### 后端优化

1. **数据库优化**
   - 关键字段索引(email, project_id等)
   - 分页查询(避免全表扫描)
   - 连接池复用

2. **Redis缓存**
   - 热点数据缓存(音色列表、用户信息)
   - 音频URL缓存(30天)
   - Session缓存

3. **API优化**
   - 响应Gzip压缩
   - 批量查询(避免N+1问题)
   - 异步处理(长任务)

### TTS优化

1. **并发控制**
   - 10个API请求并发(避免限流)
   - p-limit库控制并发数

2. **缓存策略**
   - Redis缓存相同文本+音色的音频
   - 节省30-50%成本

3. **批量优化**
   - 批量调用TTS API
   - 减少网络请求次数

---

## 🔗 相关文档

- [技术总体设计](overall-design.md)
- [技术栈选型](tech-stack.md)
- [第三方服务评估](third-party-services.md)
- [API 设计](api-design.md) - 下一步
- [数据库设计](database-design.md) - 下一步
- [技术实施路线图](implementation-roadmap.md)

---

## 📝 更新历史

| 版本 | 日期 | 变更说明 | 作者 |
|------|------|----------|------|
| 1.0  | 2026-01-22 | 初始版本,完成系统架构设计 | SmartVoice 团队 |
| 2.0  | 2026-01-22 | 重大更新:Adapter Pattern设计,MinIO+Coqui TTS自部署 | SmartVoice 团队 |

---

**架构亮点:**
- ✅ Adapter Pattern实现服务可配置切换
- ✅ MinIO自部署替代OSS,节省¥960/年
- ✅ Coqui TTS自部署替代百度API,节省¥4,500/年
- ✅ Deepseek API替代OpenAI,节省¥70/年
- ✅ 总成本从¥7,720降至¥2,524(节省67%)

**下一步:** 基于系统架构设计,进入"模块4:API和数据库设计",详细设计API接口和数据库表结构。
