# [产品名] API 设计文档

**版本:** 1.0
**日期:** [日期]
**状态:** 草稿

---

## 📋 API 概述

### API 架构风格

**选择:** RESTful API

**基础 URL:** `https://api.[产品域名].com/v1`

**认证方式:** JWT Bearer Token

**数据格式:** JSON

---

## 🔐 认证和鉴权

### 认证流程

**JWT Token 结构:**
```json
{
  "user_id": "uuid",
  "email": "user@example.com",
  "subscription_tier": "premium",
  "iat": 1234567890,
  "exp": 1234567890
}
```

**请求 Header:**
```
Authorization: Bearer <jwt_token>
```

**Token 过期:**
- Access Token: 7 天
- Refresh Token: 30 天

---

## 📝 通用规范

### 请求格式

**HTTP Method:**
- GET: 查询资源
- POST: 创建资源
- PUT: 更新资源(全量)
- PATCH: 更新资源(部分)
- DELETE: 删除资源

**Content-Type:**
```
Content-Type: application/json
```

### 响应格式

**成功响应:**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    // 实际数据
  }
}
```

**错误响应:**
```json
{
  "code": 1001,
  "message": "用户未登录",
  "error": "Unauthorized",
  "timestamp": "2026-01-20T10:00:00Z"
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
  "phone": "+86 138 0000 0000"
}
```

**响应:**
```json
{
  "code": 0,
  "message": "注册成功",
  "data": {
    "user_id": "uuid",
    "email": "user@example.com",
    "token": "jwt_token"
  }
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
  "code": 0,
  "message": "登录成功",
  "data": {
    "user_id": "uuid",
    "email": "user@example.com",
    "subscription_tier": "free",
    "token": "jwt_token",
    "refresh_token": "refresh_token"
  }
}
```

---

#### 1.3 刷新 Token

```
POST /api/v1/auth/refresh
```

**请求体:**
```json
{
  "refresh_token": "refresh_token"
}
```

**响应:**
```json
{
  "code": 0,
  "message": "Token 刷新成功",
  "data": {
    "token": "new_jwt_token",
    "refresh_token": "new_refresh_token"
  }
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
  "code": 0,
  "message": "success",
  "data": {
    "user_id": "uuid",
    "email": "user@example.com",
    "phone": "+86 138 0000 0000",
    "subscription_tier": "premium",
    "quota_used": 50000,
    "quota_total": 100000,
    "created_at": "2026-01-01T00:00:00Z"
  }
}
```

---

#### 2.2 更新用户信息

```
PATCH /api/v1/users/me
```

**请求体:**
```json
{
  "phone": "+86 138 0000 1111",
  "avatar_url": "https://cdn.example.com/avatar.jpg"
}
```

**响应:**
```json
{
  "code": 0,
  "message": "更新成功",
  "data": {
    "user_id": "uuid",
    "phone": "+86 138 0000 1111",
    "avatar_url": "https://cdn.example.com/avatar.jpg"
  }
}
```

---

### 3. 项目模块

#### 3.1 创建项目

```
POST /api/v1/projects
```

**请求体 (multipart/form-data):**
```
file: <file_binary>
name: "我的小说项目"
```

**响应:**
```json
{
  "code": 0,
  "message": "项目创建成功",
  "data": {
    "project_id": "uuid",
    "name": "我的小说项目",
    "status": "parsing",
    "source_file_url": "https://oss.example.com/files/xxx.txt",
    "created_at": "2026-01-20T10:00:00Z"
  }
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
  "code": 0,
  "message": "success",
  "data": {
    "projects": [
      {
        "project_id": "uuid",
        "name": "我的小说项目",
        "status": "completed",
        "chapter_count": 120,
        "character_count": 15,
        "created_at": "2026-01-20T10:00:00Z",
        "updated_at": "2026-01-21T15:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "total_pages": 3
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
  "code": 0,
  "message": "success",
  "data": {
    "project_id": "uuid",
    "name": "我的小说项目",
    "status": "completed",
    "source_file_url": "https://oss.example.com/files/xxx.txt",
    "chapter_count": 120,
    "character_count": 15,
    "total_words": 500000,
    "created_at": "2026-01-20T10:00:00Z",
    "updated_at": "2026-01-21T15:30:00Z"
  }
}
```

---

#### 3.4 删除项目

```
DELETE /api/v1/projects/:project_id
```

**响应:**
```json
{
  "code": 0,
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
  "code": 0,
  "message": "success",
  "data": {
    "chapters": [
      {
        "chapter_id": "uuid",
        "chapter_number": 1,
        "title": "第一章 开始",
        "word_count": 5000,
        "has_audio": true,
        "audio_url": "https://cdn.example.com/audio/ch1.mp3",
        "audio_duration": 600
      },
      {
        "chapter_id": "uuid",
        "chapter_number": 2,
        "title": "第二章 冒险",
        "word_count": 5200,
        "has_audio": false
      }
    ]
  }
}
```

---

#### 4.2 获取章节详情

```
GET /api/v1/chapters/:chapter_id
```

**响应:**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "chapter_id": "uuid",
    "project_id": "uuid",
    "chapter_number": 1,
    "title": "第一章 开始",
    "content": "章节完整文本内容...",
    "word_count": 5000,
    "paragraphs": [
      {
        "type": "dialogue",
        "character_id": "uuid",
        "text": "你好,很高兴见到你。"
      },
      {
        "type": "narration",
        "text": "他微笑着说道。"
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
  "code": 0,
  "message": "success",
  "data": {
    "characters": [
      {
        "character_id": "uuid",
        "name": "张三",
        "gender": "male",
        "importance": "主要角色",
        "dialogue_count": 320,
        "voice_id": "voice_001",
        "voice_name": "磁性男声",
        "voice_config": {
          "speed": 1.0,
          "pitch": 0,
          "volume": 100,
          "emotion": "neutral"
        }
      },
      {
        "character_id": "uuid",
        "name": "李四",
        "gender": "female",
        "importance": "主要角色",
        "dialogue_count": 280,
        "voice_id": "voice_010",
        "voice_name": "温柔女声",
        "voice_config": {
          "speed": 1.1,
          "pitch": 2,
          "volume": 100,
          "emotion": "gentle"
        }
      }
    ],
    "narrator": {
      "character_id": "uuid",
      "name": "旁白",
      "voice_id": "narrator_001",
      "voice_name": "专业叙述"
    }
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
  "name": "张三",
  "voice_id": "voice_002",
  "voice_config": {
    "speed": 1.2,
    "pitch": 1,
    "volume": 110,
    "emotion": "cheerful"
  }
}
```

**响应:**
```json
{
  "code": 0,
  "message": "角色配置更新成功",
  "data": {
    "character_id": "uuid",
    "name": "张三",
    "voice_id": "voice_002",
    "voice_config": {
      "speed": 1.2,
      "pitch": 1,
      "volume": 110,
      "emotion": "cheerful"
    }
  }
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
  "text": "这是一段预览文本,用于测试音色效果。",
  "voice_config": {
    "speed": 1.0,
    "pitch": 0,
    "emotion": "neutral"
  }
}
```

**响应:**
```json
{
  "code": 0,
  "message": "预览生成成功",
  "data": {
    "preview_url": "https://cdn.example.com/preview/xxx.mp3",
    "duration": 5,
    "expires_at": "2026-01-20T11:00:00Z"
  }
}
```

---

### 6. 音色库模块

#### 6.1 获取音色列表

```
GET /api/v1/voices?gender=male&category=standard
```

**查询参数:**
- gender: 性别筛选(male/female/neutral)
- category: 音色类别(standard/premium/custom)

**响应:**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "voices": [
      {
        "voice_id": "voice_001",
        "name": "磁性男声",
        "gender": "male",
        "category": "standard",
        "description": "成熟稳重,适合叙述和严肃角色",
        "sample_url": "https://cdn.example.com/samples/voice_001.mp3",
        "supported_emotions": ["neutral", "serious", "gentle"]
      },
      {
        "voice_id": "voice_002",
        "name": "活力青年",
        "gender": "male",
        "category": "standard",
        "description": "年轻活力,适合热血主角",
        "sample_url": "https://cdn.example.com/samples/voice_002.mp3",
        "supported_emotions": ["cheerful", "excited", "angry"]
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
  "chapter_ids": ["uuid1", "uuid2", "uuid3"],
  "mode": "batch"
}
```

**响应:**
```json
{
  "code": 0,
  "message": "生成任务创建成功",
  "data": {
    "task_id": "uuid",
    "project_id": "uuid",
    "chapter_count": 3,
    "status": "pending",
    "created_at": "2026-01-20T10:00:00Z"
  }
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
  "code": 0,
  "message": "success",
  "data": {
    "task_id": "uuid",
    "project_id": "uuid",
    "status": "processing",
    "progress": 45,
    "current_chapter": "第二章",
    "completed_chapters": 1,
    "total_chapters": 3,
    "estimated_time_remaining": 120,
    "created_at": "2026-01-20T10:00:00Z",
    "updated_at": "2026-01-20T10:05:00Z"
  }
}
```

**任务状态:**
- pending: 待处理
- processing: 处理中
- completed: 已完成
- failed: 失败

---

#### 7.3 获取任务进度(WebSocket)

```
ws://api.example.com/v1/tasks/:task_id/progress
```

**消息格式:**
```json
{
  "type": "progress",
  "data": {
    "task_id": "uuid",
    "progress": 50,
    "current_chapter": "第二章",
    "message": "正在生成第二章音频..."
  }
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
  "code": 0,
  "message": "success",
  "data": {
    "audios": [
      {
        "audio_id": "uuid",
        "chapter_id": "uuid",
        "chapter_title": "第一章 开始",
        "audio_url": "https://cdn.example.com/audio/ch1.mp3",
        "duration": 600,
        "file_size": 5242880,
        "format": "mp3",
        "created_at": "2026-01-20T10:30:00Z"
      }
    ]
  }
}
```

---

#### 8.2 生成下载链接

```
POST /api/v1/audios/:audio_id/download
```

**响应:**
```json
{
  "code": 0,
  "message": "下载链接生成成功",
  "data": {
    "download_url": "https://cdn.example.com/download/xxx.mp3?sign=xxx",
    "expires_at": "2026-01-20T11:00:00Z"
  }
}
```

---

#### 8.3 批量导出

```
POST /api/v1/projects/:project_id/export
```

**请求体:**
```json
{
  "chapter_ids": ["uuid1", "uuid2", "uuid3"],
  "format": "zip"
}
```

**响应:**
```json
{
  "code": 0,
  "message": "导出任务创建成功",
  "data": {
    "export_id": "uuid",
    "status": "processing",
    "estimated_time": 60
  }
}
```

---

## 🔄 WebSocket 实时通信

### 连接 URL

```
ws://api.example.com/v1/ws?token=<jwt_token>
```

### 消息类型

**1. 任务进度更新**
```json
{
  "type": "task_progress",
  "data": {
    "task_id": "uuid",
    "progress": 75,
    "message": "正在生成第三章..."
  }
}
```

**2. 任务完成通知**
```json
{
  "type": "task_completed",
  "data": {
    "task_id": "uuid",
    "result": {
      "completed_chapters": 3,
      "total_duration": 1800
    }
  }
}
```

**3. 任务失败通知**
```json
{
  "type": "task_failed",
  "data": {
    "task_id": "uuid",
    "error": "TTS API 调用失败"
  }
}
```

---

## ⚠️ 错误码

| 错误码 | 说明 |
|-------|------|
| 0 | 成功 |
| 1001 | 用户未登录 |
| 1002 | Token 过期 |
| 1003 | Token 无效 |
| 1004 | 权限不足 |
| 2001 | 参数错误 |
| 2002 | 资源不存在 |
| 2003 | 资源已存在 |
| 3001 | 文件格式不支持 |
| 3002 | 文件大小超限 |
| 3003 | 文本解析失败 |
| 4001 | TTS 服务调用失败 |
| 4002 | 音频生成失败 |
| 5001 | 配额不足 |
| 5002 | 请求限流 |
| 9999 | 服务器内部错误 |

---

## 🎯 API 限流策略

### 限流规则

**免费用户:**
- 100 请求/分钟
- 1000 请求/小时
- 10000 请求/天

**付费用户:**
- 300 请求/分钟
- 5000 请求/小时
- 50000 请求/天

**限流响应:**
```json
{
  "code": 5002,
  "message": "请求过于频繁,请稍后再试",
  "retry_after": 60
}
```

---

## 🔗 相关文档

- [系统架构设计](system-architecture.md)
- [数据库设计](database-design.md)
- [技术栈选型](tech-stack.md)

---

## 📝 更新历史

| 版本 | 日期 | 变更说明 | 作者 |
|------|------|----------|------|
| 1.0  | [日期] | 初始版本 | [团队] |
