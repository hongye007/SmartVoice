# SmartVoice API 设计文档

**版本:** 1.0
**日期:** 2026-01-22
**状态:** 草稿

---

## 📋 API 概述

### API 架构风格

**选择:** RESTful API

**基础 URL:** `https://api.smartvoice.com/v1`

**认证方式:** JWT Bearer Token

**数据格式:** JSON

---

## 🔐 认证和鉴权

### JWT Token 结构
```json
{
  "user_id": "uuid",
  "email": "user@example.com",
  "subscription_tier": "free",
  "iat": 1674123456,
  "exp": 1674729456
}
```

**请求 Header:**
```
Authorization: Bearer <jwt_token>
```

**Token 有效期:**
- Access Token: 7 天
- Refresh Token: 30 天

---

## 📝 通用规范

### 响应格式

**成功响应:**
```json
{
  "success": true,
  "data": {
    // 实际数据
  },
  "message": "操作成功",
  "timestamp": 1674123456789
}
```

**错误响应:**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "用户未登录"
  },
  "timestamp": 1674123456789
}
```

### HTTP 状态码

- 200 OK - 请求成功
- 201 Created - 资源创建成功
- 400 Bad Request - 请求参数错误
- 401 Unauthorized - 未认证
- 403 Forbidden - 无权限
- 404 Not Found - 资源不存在
- 429 Too Many Requests - 请求限流
- 500 Internal Server Error - 服务器错误

---

## 🔗 API 端点

### 1. 认证模块

#### 1.1 用户注册

```
POST /api/v1/auth/register
```

**请求体:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "display_name": "张三"
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "display_name": "张三",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "注册成功"
}
```

---

#### 1.2 用户登录

```
POST /api/v1/auth/login
```

**请求体:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "display_name": "张三",
    "subscription_tier": "free",
    "quota_remaining": 1,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "登录成功"
}
```

---

### 2. 用户模块

#### 2.1 获取当前用户信息

```
GET /api/v1/users/me
```

**响应:**
```json
{
  "success": true,
  "data": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "display_name": "张三",
    "subscription_tier": "free",
    "quota_remaining": 1,
    "created_at": "2026-01-20T10:00:00Z"
  }
}
```

---

### 3. 项目模块

#### 3.1 创建项目(上传文件)

```
POST /api/v1/projects
Content-Type: multipart/form-data
```

**请求体:**
```
file: <txt文件二进制>
name: "三体·第一部"
```

**响应:**
```json
{
  "success": true,
  "data": {
    "project_id": "660e8400-e29b-41d4-a716-446655440000",
    "name": "三体·第一部",
    "status": "uploading",
    "source_file_url": "https://smartvoice-oss.oss-cn-hangzhou.aliyuncs.com/uploads/xxx.txt",
    "created_at": "2026-01-22T10:00:00Z"
  },
  "message": "项目创建成功,正在解析文本"
}
```

---

#### 3.2 获取项目列表

```
GET /api/v1/projects?page=1&limit=10&status=completed
```

**查询参数:**
- page: 页码(默认 1)
- limit: 每页数量(默认 10,最大 50)
- status: 项目状态筛选(可选)

**响应:**
```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "project_id": "660e8400-e29b-41d4-a716-446655440000",
        "name": "三体·第一部",
        "status": "completed",
        "word_count": 300000,
        "chapter_count": 38,
        "character_count": 15,
        "audio_generated": 38,
        "created_at": "2026-01-20T10:00:00Z",
        "updated_at": "2026-01-21T15:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "total_pages": 1
    }
  }
}
```

---

#### 3.3 获取项目详情

```
GET /api/v1/projects/:project_id
```

**响应:**
```json
{
  "success": true,
  "data": {
    "project_id": "660e8400-e29b-41d4-a716-446655440000",
    "name": "三体·第一部",
    "status": "completed",
    "source_file_url": "https://smartvoice-oss.oss-cn-hangzhou.aliyuncs.com/uploads/xxx.txt",
    "file_size_bytes": 512000,
    "word_count": 300000,
    "chapter_count": 38,
    "character_count": 15,
    "audio_generated": 38,
    "progress": 100,
    "created_at": "2026-01-20T10:00:00Z",
    "updated_at": "2026-01-21T15:30:00Z"
  }
}
```

**项目状态(status):**
- `uploading` - 上传中
- `parsing` - 解析中
- `parsed` - 解析完成
- `recognizing` - 角色识别中
- `ready` - 就绪(可生成音频)
- `generating` - 音频生成中
- `completed` - 完成
- `failed` - 失败

---

#### 3.4 删除项目

```
DELETE /api/v1/projects/:project_id
```

**响应:**
```json
{
  "success": true,
  "message": "项目删除成功"
}
```

---

### 4. 章节模块

#### 4.1 获取章节列表

```
GET /api/v1/projects/:project_id/chapters
```

**响应:**
```json
{
  "success": true,
  "data": {
    "chapters": [
      {
        "chapter_id": "770e8400-e29b-41d4-a716-446655440000",
        "chapter_number": 1,
        "title": "科学边界",
        "word_count": 8000,
        "has_audio": true,
        "audio_url": "https://smartvoice-cdn.cdn.aliyuncs.com/audio/ch1.mp3",
        "audio_duration": 600
      },
      {
        "chapter_id": "880e8400-e29b-41d4-a716-446655440000",
        "chapter_number": 2,
        "title": "台球",
        "word_count": 7500,
        "has_audio": false
      }
    ]
  }
}
```

---

### 5. 角色模块

#### 5.1 获取角色列表

```
GET /api/v1/projects/:project_id/characters
```

**响应:**
```json
{
  "success": true,
  "data": {
    "characters": [
      {
        "character_id": "990e8400-e29b-41d4-a716-446655440000",
        "name": "叶文洁",
        "gender": "female",
        "importance": "主角",
        "dialogue_count": 320,
        "voice_id": "voice_female_1",
        "voice_name": "知性女声",
        "voice_config": {
          "speed": 1.0,
          "pitch": 0,
          "volume": 5,
          "emotion": "neutral"
        }
      },
      {
        "character_id": "aa0e8400-e29b-41d4-a716-446655440000",
        "name": "汪淼",
        "gender": "male",
        "importance": "主角",
        "dialogue_count": 280,
        "voice_id": "voice_male_1",
        "voice_name": "磁性男声",
        "voice_config": {
          "speed": 1.0,
          "pitch": 0,
          "volume": 5,
          "emotion": "neutral"
        }
      },
      {
        "character_id": "bb0e8400-e29b-41d4-a716-446655440000",
        "name": "旁白",
        "gender": "neutral",
        "importance": "旁白",
        "dialogue_count": 1500,
        "voice_id": "narrator_001",
        "voice_name": "专业叙述",
        "voice_config": {
          "speed": 1.0,
          "pitch": 0,
          "volume": 5,
          "emotion": "neutral"
        }
      }
    ]
  }
}
```

---

#### 5.2 更新角色配置

```
PUT /api/v1/characters/:character_id
```

**请求体:**
```json
{
  "voice_id": "voice_female_2",
  "voice_config": {
    "speed": 1.1,
    "pitch": 1,
    "volume": 6,
    "emotion": "gentle"
  }
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "character_id": "990e8400-e29b-41d4-a716-446655440000",
    "name": "叶文洁",
    "voice_id": "voice_female_2",
    "voice_name": "温柔女声",
    "voice_config": {
      "speed": 1.1,
      "pitch": 1,
      "volume": 6,
      "emotion": "gentle"
    }
  },
  "message": "角色配置更新成功"
}
```

---

#### 5.3 音色预览

```
POST /api/v1/characters/:character_id/preview
```

**请求体:**
```json
{
  "text": "这是一段预览文本,用于测试音色效果。"
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "preview_url": "https://smartvoice-cdn.cdn.aliyuncs.com/preview/xxx.mp3",
    "duration": 5,
    "expires_at": "2026-01-22T11:00:00Z"
  },
  "message": "预览生成成功"
}
```

---

### 6. 音色库模块

#### 6.1 获取音色列表

```
GET /api/v1/voices?gender=male
```

**查询参数:**
- gender: 性别筛选(male/female/neutral,可选)

**响应:**
```json
{
  "success": true,
  "data": {
    "voices": [
      {
        "voice_id": "voice_male_1",
        "name": "磁性男声",
        "gender": "male",
        "description": "成熟稳重,适合叙述和严肃角色",
        "sample_url": "https://smartvoice-cdn.cdn.aliyuncs.com/samples/male_1.mp3"
      },
      {
        "voice_id": "voice_male_2",
        "name": "活力青年",
        "gender": "male",
        "description": "年轻活力,适合热血主角",
        "sample_url": "https://smartvoice-cdn.cdn.aliyuncs.com/samples/male_2.mp3"
      }
    ]
  }
}
```

---

### 7. TTS 生成模块

#### 7.1 创建生成任务

```
POST /api/v1/projects/:project_id/generate
```

**请求体:**
```json
{
  "chapter_ids": [
    "770e8400-e29b-41d4-a716-446655440000",
    "880e8400-e29b-41d4-a716-446655440000"
  ]
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "task_id": "cc0e8400-e29b-41d4-a716-446655440000",
    "project_id": "660e8400-e29b-41d4-a716-446655440000",
    "chapter_count": 2,
    "estimated_word_count": 15500,
    "estimated_cost": 2.33,
    "estimated_duration_seconds": 120,
    "status": "pending",
    "created_at": "2026-01-22T10:00:00Z"
  },
  "message": "生成任务创建成功"
}
```

---

#### 7.2 获取任务状态

```
GET /api/v1/tasks/:task_id
```

**响应:**
```json
{
  "success": true,
  "data": {
    "task_id": "cc0e8400-e29b-41d4-a716-446655440000",
    "project_id": "660e8400-e29b-41d4-a716-446655440000",
    "status": "processing",
    "progress": 45,
    "current_chapter_id": "880e8400-e29b-41d4-a716-446655440000",
    "current_chapter_title": "台球",
    "completed_chapters": 1,
    "total_chapters": 2,
    "estimated_time_remaining": 60,
    "actual_cost": 1.20,
    "created_at": "2026-01-22T10:00:00Z",
    "started_at": "2026-01-22T10:00:05Z",
    "updated_at": "2026-01-22T10:01:00Z"
  }
}
```

**任务状态(status):**
- `pending` - 待处理
- `processing` - 处理中
- `completed` - 已完成
- `failed` - 失败
- `cancelled` - 已取消

---

#### 7.3 取消任务

```
DELETE /api/v1/tasks/:task_id
```

**响应:**
```json
{
  "success": true,
  "message": "任务已取消"
}
```

---

### 8. 音频管理模块

#### 8.1 获取音频列表

```
GET /api/v1/projects/:project_id/audios
```

**响应:**
```json
{
  "success": true,
  "data": {
    "audios": [
      {
        "audio_id": "dd0e8400-e29b-41d4-a716-446655440000",
        "chapter_id": "770e8400-e29b-41d4-a716-446655440000",
        "chapter_number": 1,
        "chapter_title": "科学边界",
        "filename": "三体·第一部-第01章-科学边界.mp3",
        "cdn_url": "https://smartvoice-cdn.cdn.aliyuncs.com/audio/ch1.mp3",
        "duration_seconds": 600,
        "file_size_bytes": 5242880,
        "format": "mp3",
        "created_at": "2026-01-22T10:15:00Z",
        "expires_at": "2026-01-29T10:15:00Z"
      }
    ],
    "total_duration": 1200,
    "total_size": 10485760
  }
}
```

---

#### 8.2 获取播放URL

```
GET /api/v1/audios/:audio_id/play
```

**响应:**
```json
{
  "success": true,
  "data": {
    "play_url": "https://smartvoice-cdn.cdn.aliyuncs.com/audio/ch1.mp3",
    "duration": 600,
    "format": "mp3"
  }
}
```

---

#### 8.3 获取下载URL

```
GET /api/v1/audios/:audio_id/download
```

**响应:**
```json
{
  "success": true,
  "data": {
    "download_url": "https://smartvoice-oss.oss-cn-hangzhou.aliyuncs.com/audio/ch1.mp3?OSSAccessKeyId=xxx&Expires=xxx&Signature=xxx",
    "filename": "三体·第一部-第01章-科学边界.mp3",
    "expires_at": "2026-01-29T10:00:00Z"
  },
  "message": "下载链接生成成功"
}
```

---

#### 8.4 删除音频

```
DELETE /api/v1/audios/:audio_id
```

**响应:**
```json
{
  "success": true,
  "message": "音频删除成功"
}
```

---

## 🔄 WebSocket 实时通信

### 连接 URL

```
wss://api.smartvoice.com/v1/ws?token=<jwt_token>
```

### 消息类型

#### 1. 解析进度更新

```json
{
  "type": "parsing_progress",
  "data": {
    "project_id": "660e8400-e29b-41d4-a716-446655440000",
    "progress": 50,
    "message": "正在解析章节..."
  },
  "timestamp": 1674123456789
}
```

#### 2. 角色识别进度

```json
{
  "type": "recognition_progress",
  "data": {
    "project_id": "660e8400-e29b-41d4-a716-446655440000",
    "progress": 30,
    "message": "正在识别角色..."
  },
  "timestamp": 1674123456789
}
```

#### 3. TTS生成进度

```json
{
  "type": "task_progress",
  "data": {
    "task_id": "cc0e8400-e29b-41d4-a716-446655440000",
    "progress": 75,
    "current_chapter": "台球",
    "message": "正在生成第二章音频..."
  },
  "timestamp": 1674123456789
}
```

#### 4. 任务完成通知

```json
{
  "type": "task_completed",
  "data": {
    "task_id": "cc0e8400-e29b-41d4-a716-446655440000",
    "completed_chapters": 2,
    "total_duration": 1200,
    "actual_cost": 2.33
  },
  "timestamp": 1674123456789
}
```

#### 5. 任务失败通知

```json
{
  "type": "task_failed",
  "data": {
    "task_id": "cc0e8400-e29b-41d4-a716-446655440000",
    "error_code": "TTS_API_FAILED",
    "error_message": "百度TTS API调用失败,已重试3次"
  },
  "timestamp": 1674123456789
}
```

---

## ⚠️ 错误码

| 错误码 | 说明 | HTTP状态码 |
|-------|------|----------|
| `SUCCESS` | 成功 | 200 |
| `UNAUTHORIZED` | 用户未登录 | 401 |
| `TOKEN_EXPIRED` | Token过期 | 401 |
| `TOKEN_INVALID` | Token无效 | 401 |
| `FORBIDDEN` | 权限不足 | 403 |
| `INVALID_PARAMS` | 参数错误 | 400 |
| `RESOURCE_NOT_FOUND` | 资源不存在 | 404 |
| `RESOURCE_EXISTS` | 资源已存在 | 400 |
| `FILE_FORMAT_UNSUPPORTED` | 文件格式不支持 | 400 |
| `FILE_SIZE_EXCEEDED` | 文件大小超限 | 400 |
| `PARSING_FAILED` | 文本解析失败 | 500 |
| `TTS_API_FAILED` | TTS服务调用失败 | 500 |
| `AUDIO_GENERATION_FAILED` | 音频生成失败 | 500 |
| `QUOTA_EXCEEDED` | 配额不足 | 403 |
| `RATE_LIMIT_EXCEEDED` | 请求限流 | 429 |
| `INTERNAL_ERROR` | 服务器内部错误 | 500 |

---

## 🎯 API 限流策略

### 限流规则

**免费用户:**
- 100 请求/分钟
- 10 个并发TTS任务(全局)
- 1 个并发TTS任务/用户

**付费用户(V1.0):**
- 300 请求/分钟
- 5 个并发TTS任务/用户

**限流响应:**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "请求过于频繁,请60秒后再试",
    "retry_after": 60
  },
  "timestamp": 1674123456789
}
```

**Response Header:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1674123516
```

---

## 🔗 相关文档

- [系统架构设计](system-architecture.md)
- [数据库设计](database-design.md) - 下一步
- [技术栈选型](tech-stack.md)

---

## 📝 更新历史

| 版本 | 日期 | 变更说明 | 作者 |
|------|------|----------|------|
| 1.0  | 2026-01-22 | 初始版本,完成REST API和WebSocket设计 | SmartVoice 团队 |

---

**下一步:** 进入数据库详细设计,定义所有表结构、索引、关系和查询优化策略。
