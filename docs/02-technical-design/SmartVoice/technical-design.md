# SmartVoice 技术架构设计文档(总览)

**版本:** 2.0
**日期:** 2026-01-22
**状态:** 已确认
**团队:** SmartVoice 技术团队

---

## 📄 文档说明

本文档是 SmartVoice 项目的技术架构设计总览,整合了从技术选型到实施路线的完整技术方案。

**文档结构:**
- 本文档:技术设计概要和决策汇总
- 详细设计:各模块独立文档(见下方)

---

## 🎯 项目概述

### 产品定位

SmartVoice 是一款AI驱动的多角色有声小说生成工具,帮助内容创作者和文学爱好者快速将文字作品转换为高质量的多角色有声音频。

**核心价值:**
- 智能角色识别(准确率>85%)
- 多音色TTS合成
- 批量章节生成
- 一键音频导出

### 技术约束

| 约束条件 | 具体要求 |
|---------|---------|
| 团队规模 | 2人兼职,全栈能力 |
| 技术能力 | React⭐⭐⭐⭐⭐, Node.js⭐⭐⭐⭐⭐, PostgreSQL⭐⭐⭐⭐ |
| 开发预算 | ¥2,524/年(MVP),远低于¥1万预算 |
| 开发周期 | 3.75个月(分阶段) |
| 目标并发 | 500-1000用户 |
| 性能要求 | API响应<300ms(P95), 10万字解析<30秒 |

---

## 📊 技术决策总结

### 核心技术栈

| 层级 | 技术选型 | 理由 |
|------|---------|------|
| **前端** | React 18 + TypeScript + Vite | 团队熟练度⭐⭐⭐⭐⭐,生态丰富,适合复杂交互 |
| **状态管理** | Zustand | 轻量,API简单,适合中小型应用 |
| **UI组件库** | Ant Design 5 | 企业级组件丰富,开箱即用 |
| **后端** | Node.js 18 + Express | JS全栈,异步IO适合高并发API调用 |
| **ORM** | Prisma | 类型安全,自动生成TypeScript类型 |
| **数据库** | PostgreSQL 14 | 关系型数据清晰,JSON支持好 |
| **缓存/队列** | Redis 7 | 音频缓存、Bull任务队列、Session |
| **对象存储(主)** | MinIO(自部署) | S3兼容,零边际成本,可一键切换OSS |
| **对象存储(备)** | 阿里云OSS | 异地备份、CDN加速 |
| **TTS服务(主)** | Coqui TTS(自部署) | GPU推理,边际成本¥0,音质可接受 |
| **TTS服务(备)** | 百度智能云 | 自动Fallback,音质稳定 |
| **NLP服务** | Deepseek API | 最便宜(¥0.001/千token),准确率>90% |

**决策依据:**
- ✅ 团队能力完美匹配(零学习成本)
- ✅ 高度契合产品需求(复杂交互、实时通信、高并发)
- ✅ 开发效率最大化(JS全栈、TypeScript类型安全)
- ✅ 成本极低(自部署优先,MVP ¥2,524/年,节省67%)

---

### 第三方服务选型

| 服务类型 | 选定方案 | 年成本 | 关键指标 |
|---------|---------|-------|---------|
| **TTS语音合成(主)** | Coqui TTS(自部署) | 固定¥2,160(GPU) | GPU推理,边际成本¥0,音质⭐⭐⭐⭐ |
| **TTS语音合成(备)** | 百度智能云 | 按需¥45/项目 | 自动Fallback,音质稳定 |
| **NLP处理** | Deepseek API | ¥30/年(100项目) | 最便宜(¥0.001/千token),准确率>90% |
| **对象存储(主)** | MinIO(自部署) | ¥0 | S3兼容,零边际成本 |
| **对象存储(备)** | 阿里云OSS | ¥14/年(备份) | 异地备份,按需付费 |
| **云服务** | 阿里云ECS(GPU) | ¥2,160/年 | 1核4G + Tesla T4 GPU |

**MVP年总成本:** ¥2,524(100个项目) vs 旧方案¥7,720 - **节省67%** ✅

**成本优化策略:**
- 自部署TTS(Coqui)边际成本¥0
- 自部署存储(MinIO)零成本
- Deepseek API比OpenAI便宜70%
- Redis缓存音频(节省30-50%)
- 用户付费模式(¥10-50/项目)
- Adapter Pattern支持一键切换云服务

---

### 系统架构模式

**选择:** 分层单体应用(Layered Monolith) + Adapter Pattern

**架构图:**
```
用户层(React Web)
    ↓ HTTPS/WebSocket
CDN层(静态资源、音频加速)
    ↓
API网关层(Nginx + JWT认证 + 限流)
    ↓
应用服务层(Node.js + Express)
  - 7大核心模块:用户、项目、解析、角色、TTS、音频、通知
  - 异步Worker(TTS生成)
  - Service Adapter层(Storage/TTS/NLP统一接口)
    ↓
数据访问层(Prisma ORM + Redis Client + Bull + MinIO SDK)
    ↓
数据存储层(PostgreSQL + Redis + MinIO + Coqui TTS Server)
    ↓
第三方服务层(Deepseek API + 百度TTS备用 + OSS备份)
```

**选择理由:**
- 适合MVP快速迭代
- 成本最低(单服务器 + GPU即可)
- 运维简单(适合2人团队)
- Adapter Pattern支持灵活切换服务
- 后续可拆分为微服务

---

## 📁 详细文档索引

### 模块 0: 技术总体设计

📄 **文档:** [overall-design.md](overall-design.md)

**内容概要:**
- 4个核心业务流程的技术映射
- 4个关键技术挑战及解决方案
- 技术边界和约束分析
- 端到端技术全链路视图

**关键业务流程:**
1. 文本上传到角色识别
2. 音色配置和预览
3. 批量音频生成
4. 音频预览和导出

**关键技术挑战:**
1. 角色识别准确率(目标>85%) - 使用GPT API
2. TTS成本控制 - 并发调用+音频缓存
3. 大文件处理性能(10万字<30秒) - 分块处理+WebSocket流式响应
4. 音频拼接质量 - ffmpeg批量拼接

---

### 模块 1: 技术栈选型

📄 **文档:** [tech-stack.md](tech-stack.md)

**内容概要:**
- 前端/后端/数据库技术选型对比
- 配套工具链选择
- 决策理由分析(团队、需求、效率、成本)

**核心决策:**
- **前端:** React 18 + TypeScript + Vite + Zustand + Ant Design 5
- **后端:** Node.js 18 + Express + Prisma + Bull + Socket.io
- **数据库:** PostgreSQL 14(主库) + Redis 7(缓存/队列)

**技术优势:**
- 团队能力完美匹配(⭐⭐⭐⭐⭐)
- JS全栈无上下文切换
- 异步IO适合高并发TTS调用
- 成本极低(全开源)

---

### 模块 2: 第三方服务评估

📄 **文档:** [third-party-services.md](third-party-services.md)

**内容概要:**
- TTS服务商对比(百度vs讯飞vs阿里云vs自建)
- NLP服务商对比(OpenAI vs国产大模型vs自建)
- 云服务对比(阿里云vs腾讯云vs AWS)
- 成本估算(不同用户规模)

**服务商决策:**
1. **TTS:** 百度智能云(¥0.15/千字,性价比最高)
2. **NLP:** OpenAI GPT-4o-mini(准确率>90%,¥1/项目)
3. **云服务:** 阿里云(生态完整,国内访问快)

**MVP年成本:** ¥7,720(固定¥3,120 + 变动¥4,600)

---

### 模块 3: 系统架构设计

📄 **文档:** [system-architecture.md](system-architecture.md)

**内容概要:**
- 整体架构设计(6层架构 + Adapter Pattern)
- Service Adapter层设计(Storage/TTS/NLP统一接口)
- 7大核心模块详细设计
- 核心业务流程设计
- 数据库ER图和表结构
- 部署架构(Docker Compose + 阿里云ECS GPU)

**7大核心模块:**
1. 用户模块 - JWT认证、会员管理
2. 项目管理模块 - 文件上传(MinIO)、项目CRUD
3. 文本解析模块 - 章节识别、段落分割
4. 角色识别模块 - Deepseek识别角色、自动音色分配
5. TTS生成模块 - Coqui TTS(主)/百度TTS(备)、音频拼接、任务队列
6. 音频管理模块 - MinIO存储、下载服务
7. 通知服务模块 - WebSocket实时进度推送

**核心流程:**
- 项目创建→MinIO上传→解析→Deepseek角色识别(异步+WebSocket进度推送)
- TTS批量生成(Bull队列+Worker并发处理+Coqui TTS+ffmpeg拼接)

**部署方案:** Docker Compose(7个服务) + 阿里云ECS(1核4G + Tesla T4 GPU)

---

### 模块 4: API 设计

📄 **文档:** [api-design.md](api-design.md)

**内容概要:**
- RESTful API设计规范
- 8大模块API端点详细定义
- WebSocket实时通信协议
- 错误码定义
- 限流策略

**API架构:**
- 基础URL: `https://api.smartvoice.com/v1`
- 认证: JWT Bearer Token
- 响应格式: JSON

**核心API模块:**
1. 认证模块(注册、登录、Token刷新)
2. 用户模块(个人信息、配额管理)
3. 项目模块(CRUD、列表、详情)
4. 章节模块(列表、详情)
5. 角色模块(列表、配置更新、音色预览)
6. 音色库模块(音色列表)
7. TTS生成模块(创建任务、查询状态、取消任务)
8. 音频管理模块(列表、播放、下载、删除)

**WebSocket通知:**
- 解析进度、角色识别进度、TTS生成进度
- 任务完成/失败通知

---

### 模块 5: 技术实施路线图

📄 **文档:** [implementation-roadmap.md](implementation-roadmap.md)

**内容概要:**
- 技术里程碑规划(MVP/Beta/V1.0)
- 详细开发计划(任务分解、工时估算)
- 团队分工
- 开发规范(Git工作流、代码规范、测试策略、CI/CD)
- 技术风险和应对策略

**MVP阶段(第1-12周,324人时):**
- 第1-2周:基础设施搭建(40h)
- 第3-4周:用户模块+项目管理(60h)
- 第5-6周:文本解析+角色识别(68h)
- 第7-9周:TTS生成核心功能(96h)
- 第10-12周:音频管理+MVP收尾(60h)

**Beta阶段(第13-16周,104人时):**
- 功能完善(音色库扩展、项目编辑)
- 性能优化(数据库索引、API压缩、前端分割)
- 测试和修复(单元测试、E2E测试、Bug修复)

**V1.0阶段(第17-24周,120人时):**
- 商业化功能(会员订阅、支付集成、配额管理)
- 运维和监控(Sentry、日志聚合、数据库备份)
- 文档和运营(用户文档、管理后台)

**开发规范:**
- Git工作流:feature分支 → dev → main
- 代码规范:ESLint + Prettier + TypeScript
- 测试策略:单元测试(>70%覆盖) + E2E测试
- CI/CD:GitHub Actions自动构建和部署

**技术风险:**
1. Coqui TTS音质不达标 - 预训练模型测试、自动Fallback百度TTS、用户可选音质档位
2. 角色识别准确率不达标 - Deepseek Prompt优化、多模型Fallback(Qwen/OpenAI)
3. GPU成本超预算 - 按需实例、抢占式实例、监控利用率
4. MinIO单点故障 - 定期备份OSS、健康检查、可恢复
5. 开发周期延误 - 严格P0范围、AI辅助、预留缓冲
6. 第三方API稳定性 - Adapter Pattern多厂商备选、重试机制、自动Fallback

---

## 🎯 技术指标总览

### 性能指标

| 指标 | MVP目标 | Beta目标 | V1.0目标 |
|------|---------|----------|----------|
| API响应时间(P95) | <1s | <500ms | <300ms |
| 文本解析速度 | 10万字/30秒 | 10万字/20秒 | 10万字/10秒 |
| 音频生成速度 | 1分钟/万字 | 30秒/万字 | 20秒/万字 |
| 前端首屏加载 | <5s | <3s | <2s |
| 系统可用性 | >99% | >99.5% | >99.9% |
| 角色识别准确率 | >85% | >90% | >95% |

### 成本指标

| 阶段 | 用户规模 | 固定成本/年 | 变动成本/项目 | 总成本/年 |
|------|---------|-----------|-------------|----------|
| MVP | 100用户,100项目 | ¥2,240 | ¥2.84 | ¥2,524 |
| Beta | 1000用户,1000项目 | ¥9,000 | ¥3.30 | ¥12,300 |
| V1.0 | 10000用户,10000项目 | ¥18,000 | ¥3.00 | ¥48,000 |

**vs 旧方案(纯云服务)对比:**
| 阶段 | 新方案(自部署) | 旧方案(纯云) | 节省 |
|------|--------------|-------------|------|
| MVP | ¥2,524 | ¥7,720 | 67% |
| Beta | ¥12,300 | ¥49,000 | 75% |
| V1.0 | ¥48,000 | ¥377,000 | 87% |

**成本优化手段:**
- 自部署TTS(Coqui)边际成本¥0,节省¥4,500/年
- 自部署存储(MinIO)零成本,节省¥960/年
- Deepseek API比OpenAI便宜70%
- Redis缓存:节省30-50% TTS重复调用
- 用户付费:¥10-50/项目,成本转嫁
- Adapter Pattern:一键切换云服务,灵活控制成本

---

## ⚠️ 关键风险评估

| 风险 | 等级 | 影响 | 应对方案 | 责任人 |
|------|------|------|---------|--------|
| Coqui TTS音质不达标 | 🟡中 | 用户体验差 | 预训练模型测试、自动Fallback百度TTS、用户可选音质档位 | 全栈2 |
| 角色识别准确率不达标 | 🟡中 | 核心卖点受损 | Deepseek Prompt优化、多模型Fallback(Qwen/OpenAI)、人工审核 | 全栈2 |
| GPU成本超预算 | 🟡中 | 固定成本增加 | 按需实例、抢占式实例、监控利用率 | 全栈2 |
| MinIO单点故障 | 🟡中 | 文件丢失 | 定期备份OSS、健康检查、可恢复 | 全栈1 |
| 第三方API稳定性 | 🟡中 | 任务失败率高 | Adapter Pattern多厂商备选、重试、自动Fallback | 全栈2 |
| 开发周期延误 | 🟡中 | 上线时间延后 | 严格P0、AI辅助、预留缓冲 | 全员 |
| 性能瓶颈 | 🟢低 | 用户体验差 | 横向扩展、优化查询 | 全栈1+2 |

---

## 🚀 下一步行动

### 立即开始(第1周)

1. **项目初始化**
   - [ ] 创建Git仓库(GitHub)
   - [ ] 初始化Monorepo(pnpm workspace)
   - [ ] 前端脚手架(React+Vite+TypeScript)
   - [ ] 后端脚手架(Node.js+Express+TypeScript)

2. **基础设施**
   - [ ] 配置Docker环境(docker-compose.yml)
   - [ ] 创建PostgreSQL数据库
   - [ ] 配置阿里云账号(OSS Bucket)
   - [ ] 配置代码规范(ESLint+Prettier+Husky)

3. **技术预研**
   - [ ] 百度TTS API测试
   - [ ] OpenAI GPT API测试
   - [ ] 阿里云OSS上传测试

### 第2周目标

- 完成用户注册登录功能
- 完成文件上传到OSS功能
- 部署开发环境到阿里云ECS

---

## 📚 相关资源

### 产品文档

- [产品简介](../../01-product-design/SmartVoice/SmartVoice-brief.md)
- [功能规格](../../01-product-design/SmartVoice/features/feature-prioritization.md)
- [产品路线图](../../01-product-design/SmartVoice/roadmap/product-roadmap.md)

### 技术文档

- [技术总体设计](overall-design.md)
- [技术栈选型](tech-stack.md)
- [第三方服务评估](third-party-services.md)
- [系统架构设计](system-architecture.md)
- [API 设计](api-design.md)
- [技术实施路线图](implementation-roadmap.md)

### 开发资源

- Coqui TTS文档: https://github.com/coqui-ai/TTS
- Deepseek API文档: https://platform.deepseek.com
- MinIO文档: https://min.io/docs/minio/
- 百度TTS API文档: https://ai.baidu.com/ai-doc/SPEECH/Nkqsx6v7x
- 阿里云OSS文档: https://help.aliyun.com/product/31815.html

---

## 📝 文档维护

**文档所有者:** SmartVoice 技术团队

**更新频率:**
- 技术架构变更时立即更新
- 每个迭代结束后回顾更新

**版本管理:**
- 重大变更(架构调整、技术栈变更):升级主版本号(1.0 → 2.0)
- 小改动(文档完善、数据更新):升级次版本号(1.0 → 1.1)

---

## 📝 更新历史

| 版本 | 日期 | 变更说明 | 作者 |
|------|------|----------|------|
| 1.0 | 2026-01-22 | 初始版本,完成技术架构设计(纯云服务方案) | SmartVoice 技术团队 |
| 2.0 | 2026-01-22 | 重大更新:自部署优先策略,Adapter Pattern架构,成本从¥7,720降至¥2,524/年(67%) | SmartVoice 技术团队 |

---

**状态:** ✅ 技术架构设计完成(v2.0 - 自部署优先方案),可进入开发阶段

**架构决策:** MinIO + Coqui TTS + Deepseek + Adapter Pattern,MVP成本¥2,524/年,长期节省67-87% ✅

**审批:** 已确认
