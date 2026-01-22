# [产品名] 数据库设计

**版本:** 1.0
**日期:** [日期]
**状态:** 草稿

---

## 📋 数据库概述

### 数据库选择

**主数据库:** [PostgreSQL / MySQL / MongoDB]

**版本:** [14.x / 8.0 / 6.0]

**选择理由:**
- [理由 1: 功能特性]
- [理由 2: 性能表现]
- [理由 3: 团队熟悉度]

**缓存数据库:** Redis 7.x
- 用户会话缓存
- 热点数据缓存
- 任务队列

---

## 🗂️ 数据表设计

### 1. 用户模块

#### users (用户表)

**用途:** 存储用户基本信息

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  salt VARCHAR(50) NOT NULL,

  -- 用户信息
  nickname VARCHAR(100),
  avatar_url TEXT,

  -- 订阅信息
  subscription_tier VARCHAR(50) DEFAULT 'free',
  subscription_expires_at TIMESTAMP,

  -- 配额管理
  quota_used BIGINT DEFAULT 0,
  quota_total BIGINT DEFAULT 50000,
  quota_reset_at TIMESTAMP,

  -- 状态
  status VARCHAR(20) DEFAULT 'active',
  email_verified BOOLEAN DEFAULT false,

  -- 时间戳
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP
);

-- 索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_subscription ON users(subscription_tier, subscription_expires_at);
```

**字段说明:**
- subscription_tier: 订阅等级(free/basic/premium/enterprise)
- quota_used: 本周期已使用配额(字符数)
- quota_total: 本周期总配额
- quota_reset_at: 配额重置时间

---

#### user_sessions (用户会话表)

**用途:** 存储用户登录会话和 Token

```sql
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  token_hash VARCHAR(255) NOT NULL,
  refresh_token_hash VARCHAR(255),

  device_info JSONB,
  ip_address INET,
  user_agent TEXT,

  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_token ON user_sessions(token_hash);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);
```

---

### 2. 项目模块

#### projects (项目表)

**用途:** 存储用户创建的项目

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 项目信息
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- 文件信息
  source_file_url TEXT NOT NULL,
  source_file_name VARCHAR(255),
  source_file_size BIGINT,
  source_file_format VARCHAR(20),

  -- 内容统计
  total_words BIGINT,
  chapter_count INT DEFAULT 0,
  character_count INT DEFAULT 0,

  -- 状态
  status VARCHAR(50) DEFAULT 'created',
  parsing_progress INT DEFAULT 0,
  error_message TEXT,

  -- 配置
  settings JSONB,

  -- 时间戳
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_generated_at TIMESTAMP
);

-- 索引
CREATE INDEX idx_projects_user ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created ON projects(created_at DESC);
```

**status 状态值:**
- created: 已创建
- parsing: 解析中
- parsed: 解析完成
- failed: 解析失败
- archived: 已归档

---

#### chapters (章节表)

**用途:** 存储项目的章节信息

```sql
CREATE TABLE chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- 章节信息
  chapter_number INT NOT NULL,
  title VARCHAR(500),
  content TEXT NOT NULL,

  -- 统计
  word_count INT,
  paragraph_count INT,
  dialogue_count INT,

  -- 音频关联
  has_audio BOOLEAN DEFAULT false,
  audio_id UUID,

  -- 时间戳
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_chapters_project ON chapters(project_id, chapter_number);
CREATE INDEX idx_chapters_audio ON chapters(has_audio);

-- 唯一约束
CREATE UNIQUE INDEX idx_chapters_unique ON chapters(project_id, chapter_number);
```

---

#### paragraphs (段落表)

**用途:** 存储章节的段落详情(用于精细化处理)

```sql
CREATE TABLE paragraphs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- 段落信息
  paragraph_number INT NOT NULL,
  type VARCHAR(50) NOT NULL,
  text TEXT NOT NULL,

  -- 角色关联(如果是对话)
  character_id UUID,

  -- 情绪标签
  emotion VARCHAR(50),
  tone VARCHAR(50),

  -- 时间戳
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_paragraphs_chapter ON paragraphs(chapter_id, paragraph_number);
CREATE INDEX idx_paragraphs_character ON paragraphs(character_id);
CREATE INDEX idx_paragraphs_type ON paragraphs(type);
```

**type 类型:**
- dialogue: 对话
- narration: 旁白
- description: 描述

---

### 3. 角色模块

#### characters (角色表)

**用途:** 存储识别出的角色信息

```sql
CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- 角色信息
  name VARCHAR(100) NOT NULL,
  aliases JSONB,
  gender VARCHAR(20),
  importance VARCHAR(50),

  -- 统计
  dialogue_count INT DEFAULT 0,
  first_appearance_chapter INT,

  -- 音色配置
  voice_id VARCHAR(100),
  voice_name VARCHAR(100),
  voice_config JSONB,

  -- 时间戳
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_characters_project ON characters(project_id);
CREATE INDEX idx_characters_importance ON characters(importance);

-- 唯一约束
CREATE UNIQUE INDEX idx_characters_unique ON characters(project_id, name);
```

**voice_config JSONB 结构示例:**
```json
{
  "speed": 1.0,
  "pitch": 0,
  "volume": 100,
  "emotion": "neutral",
  "tone": "normal",
  "pause_duration": "medium"
}
```

---

### 4. TTS 生成模块

#### tts_tasks (TTS 任务表)

**用途:** 存储 TTS 生成任务

```sql
CREATE TABLE tts_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- 任务信息
  task_type VARCHAR(50) DEFAULT 'batch',
  chapter_ids JSONB,

  -- 状态
  status VARCHAR(50) DEFAULT 'pending',
  progress INT DEFAULT 0,
  current_chapter_id UUID,

  -- 统计
  total_chapters INT,
  completed_chapters INT DEFAULT 0,
  failed_chapters INT DEFAULT 0,

  -- 结果
  result JSONB,
  error_message TEXT,

  -- 成本
  characters_processed BIGINT DEFAULT 0,
  cost_amount DECIMAL(10, 2),

  -- 时间
  estimated_duration INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_tasks_user ON tts_tasks(user_id);
CREATE INDEX idx_tasks_project ON tts_tasks(project_id);
CREATE INDEX idx_tasks_status ON tts_tasks(status);
CREATE INDEX idx_tasks_created ON tts_tasks(created_at DESC);
```

**status 状态值:**
- pending: 待处理
- processing: 处理中
- completed: 已完成
- failed: 失败
- cancelled: 已取消

---

#### tts_requests (TTS 请求日志)

**用途:** 记录每次 TTS API 调用(用于成本追踪和调试)

```sql
CREATE TABLE tts_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tts_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,

  -- 请求信息
  text TEXT NOT NULL,
  text_length INT,
  character_id UUID,
  voice_id VARCHAR(100),
  voice_config JSONB,

  -- 响应信息
  status_code INT,
  response_time INT,
  audio_url TEXT,
  audio_duration INT,

  -- 成本
  cost_amount DECIMAL(10, 4),

  -- 第三方信息
  provider VARCHAR(50),
  provider_request_id VARCHAR(255),

  -- 错误信息
  error_message TEXT,

  -- 时间戳
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_requests_task ON tts_requests(task_id);
CREATE INDEX idx_requests_user ON tts_requests(user_id);
CREATE INDEX idx_requests_created ON tts_requests(created_at DESC);
CREATE INDEX idx_requests_provider ON tts_requests(provider);
```

---

### 5. 音频管理模块

#### audio_files (音频文件表)

**用途:** 存储生成的音频文件元数据

```sql
CREATE TABLE audio_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tts_tasks(id),

  -- 文件信息
  file_url TEXT NOT NULL,
  file_name VARCHAR(255),
  file_size BIGINT,
  file_format VARCHAR(20) DEFAULT 'mp3',

  -- 音频信息
  duration INT,
  sample_rate INT,
  bit_rate INT,

  -- 元数据
  metadata JSONB,

  -- 访问控制
  access_level VARCHAR(50) DEFAULT 'private',
  download_count INT DEFAULT 0,

  -- 存储信息
  storage_provider VARCHAR(50),
  storage_path TEXT,
  expires_at TIMESTAMP,

  -- 时间戳
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_accessed_at TIMESTAMP
);

-- 索引
CREATE INDEX idx_audio_user ON audio_files(user_id);
CREATE INDEX idx_audio_project ON audio_files(project_id);
CREATE INDEX idx_audio_chapter ON audio_files(chapter_id);
CREATE INDEX idx_audio_expires ON audio_files(expires_at);
```

---

### 6. 系统配置模块

#### voices (音色库表)

**用途:** 存储可用的音色列表

```sql
CREATE TABLE voices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 音色信息
  voice_id VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,

  -- 分类
  gender VARCHAR(20),
  category VARCHAR(50),
  tags JSONB,

  -- 提供商
  provider VARCHAR(50) NOT NULL,
  provider_voice_id VARCHAR(255),

  -- 能力
  supported_emotions JSONB,
  supported_languages JSONB,

  -- 样本
  sample_url TEXT,
  sample_text TEXT,

  -- 可用性
  is_active BOOLEAN DEFAULT true,
  is_premium BOOLEAN DEFAULT false,

  -- 排序和推荐
  sort_order INT DEFAULT 0,
  popularity_score INT DEFAULT 0,

  -- 时间戳
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_voices_provider ON voices(provider);
CREATE INDEX idx_voices_category ON voices(category);
CREATE INDEX idx_voices_gender ON voices(gender);
CREATE INDEX idx_voices_active ON voices(is_active);
```

---

#### system_configs (系统配置表)

**用途:** 存储系统级配置

```sql
CREATE TABLE system_configs (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  category VARCHAR(50),

  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID
);
```

**配置示例:**
```json
{
  "key": "tts_default_provider",
  "value": {"provider": "xunfei", "fallback": "baidu"},
  "description": "默认 TTS 服务提供商",
  "category": "tts"
}
```

---

### 7. 日志和统计模块

#### user_activities (用户活动日志)

**用途:** 记录用户操作日志

```sql
CREATE TABLE user_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- 活动信息
  activity_type VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,

  -- 详情
  details JSONB,

  -- 请求信息
  ip_address INET,
  user_agent TEXT,

  -- 时间戳
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_activities_user ON user_activities(user_id, created_at DESC);
CREATE INDEX idx_activities_type ON user_activities(activity_type);
CREATE INDEX idx_activities_created ON user_activities(created_at DESC);
```

**activity_type 示例:**
- user_register
- user_login
- project_create
- audio_generate
- audio_download

---

#### usage_statistics (使用统计表)

**用途:** 记录用户使用统计(按天聚合)

```sql
CREATE TABLE usage_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 统计日期
  stat_date DATE NOT NULL,

  -- 使用量统计
  projects_created INT DEFAULT 0,
  chapters_generated INT DEFAULT 0,
  characters_processed BIGINT DEFAULT 0,
  audio_duration_seconds INT DEFAULT 0,

  -- 成本统计
  api_calls INT DEFAULT 0,
  total_cost DECIMAL(10, 2) DEFAULT 0,

  -- 时间戳
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE UNIQUE INDEX idx_stats_user_date ON usage_statistics(user_id, stat_date);
CREATE INDEX idx_stats_date ON usage_statistics(stat_date DESC);
```

---

## 🔗 关系图

```
users (用户)
  ├─ user_sessions (会话)
  ├─ projects (项目)
  │    ├─ chapters (章节)
  │    │    ├─ paragraphs (段落)
  │    │    └─ audio_files (音频)
  │    ├─ characters (角色)
  │    └─ tts_tasks (任务)
  │         └─ tts_requests (请求日志)
  └─ usage_statistics (统计)

voices (音色库) - 独立表
system_configs (配置) - 独立表
user_activities (日志) - 独立表
```

---

## 📊 数据量估算

### MVP 阶段(1万用户)

| 表名 | 预估行数 | 单行大小 | 总大小 |
|------|---------|---------|--------|
| users | 10,000 | 1 KB | 10 MB |
| projects | 50,000 | 2 KB | 100 MB |
| chapters | 2,000,000 | 10 KB | 20 GB |
| characters | 500,000 | 1 KB | 500 MB |
| audio_files | 2,000,000 | 500 B | 1 GB |
| tts_tasks | 100,000 | 2 KB | 200 MB |
| **总计** | | | **~22 GB** |

### 成长期(10万用户)

| 表名 | 预估行数 | 总大小 |
|------|---------|--------|
| users | 100,000 | 100 MB |
| projects | 500,000 | 1 GB |
| chapters | 20,000,000 | 200 GB |
| characters | 5,000,000 | 5 GB |
| audio_files | 20,000,000 | 10 GB |
| **总计** | | **~216 GB** |

---

## 🚀 性能优化

### 索引策略

**已创建索引:**
- 主键索引(自动)
- 外键索引
- 常用查询字段索引
- 复合索引(多字段查询)

**索引维护:**
- 定期分析慢查询
- 使用 EXPLAIN 优化查询计划
- 删除未使用的索引

---

### 分区策略

**大表分区(可选,成长期考虑):**

```sql
-- 按时间分区(章节表)
CREATE TABLE chapters (
  ...
) PARTITION BY RANGE (created_at);

CREATE TABLE chapters_2026_q1 PARTITION OF chapters
  FOR VALUES FROM ('2026-01-01') TO ('2026-04-01');

CREATE TABLE chapters_2026_q2 PARTITION OF chapters
  FOR VALUES FROM ('2026-04-01') TO ('2026-07-01');
```

---

### 查询优化

**常用查询优化示例:**

```sql
-- 优化前:全表扫描
SELECT * FROM projects WHERE user_id = 'xxx' ORDER BY created_at DESC;

-- 优化后:使用索引
CREATE INDEX idx_projects_user_created ON projects(user_id, created_at DESC);
```

---

## 🔄 数据备份策略

### 备份方案

**全量备份:**
- 频率: 每天凌晨 2:00
- 保留: 7 天

**增量备份:**
- 频率: 每 6 小时
- 保留: 24 小时

**关键表备份:**
- users, projects: 实时复制到从库
- audio_files: 元数据备份,文件依赖 OSS

---

## 📝 数据迁移计划

### 初始化脚本

```sql
-- 创建数据库
CREATE DATABASE smartvoice;

-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 执行所有表创建脚本
-- ...

-- 初始化系统数据
INSERT INTO system_configs (key, value, description, category)
VALUES
  ('tts_default_provider', '{"provider": "xunfei"}', 'TTS 默认提供商', 'tts'),
  ('quota_free_tier', '{"monthly": 50000}', '免费配额', 'quota');

-- 初始化音色库
INSERT INTO voices (voice_id, name, gender, category, provider, is_active)
VALUES
  ('voice_001', '磁性男声', 'male', 'standard', 'xunfei', true),
  ('voice_002', '温柔女声', 'female', 'standard', 'xunfei', true);
```

---

## 🔗 相关文档

- [系统架构设计](system-architecture.md)
- [API 设计](api-design.md)
- [技术栈选型](tech-stack.md)

---

## 📝 更新历史

| 版本 | 日期 | 变更说明 | 作者 |
|------|------|----------|------|
| 1.0  | [日期] | 初始版本 | [团队] |
