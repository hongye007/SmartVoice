# SmartVoice

> 智能多角色有声内容创作平台 - 让文字生动起来

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-%3E%3D8.0.0-orange.svg)](https://pnpm.io/)

## 简介

SmartVoice 是一款智能多角色有声内容创作 Web 应用,旨在将小说、剧本、散文等文本内容转化为专业级多角色有声作品。

**核心价值主张:** 让每个人都能轻松创作专业级的多角色有声内容,让文字生动起来。

## 核心功能

- 📄 **智能文本解析** - 自动识别章节结构和对话内容
- 🎭 **AI 角色识别** - 智能识别角色、对话、旁白,准确率 >85%
- 🎙️ **多角色 TTS** - 20+ 种音色,支持情绪和语调智能调节
- ⚡ **批量生成** - 高效批量处理,保持角色音色一致性
- 🎵 **在线预览** - 实时音频预览和在线播放
- 💾 **导出分享** - 一键导出 MP3 格式音频文件

## 技术栈

### 前端
- React 18 + TypeScript 5
- Vite (构建工具)
- Ant Design 5 (UI 组件库)
- Zustand (状态管理)
- React Router v6 (路由)
- Socket.io Client (实时通信)

### 后端
- Node.js 18 + Express 4
- TypeScript 5
- Prisma (ORM)
- Bull + Redis (任务队列)
- Socket.io (WebSocket)
- Coqui TTS (自部署 TTS)
- Deepseek API (NLP 角色识别)

### 数据库与存储
- PostgreSQL 14 (主数据库)
- Redis 7 (缓存/队列)
- MinIO (对象存储 - 自部署)

### 开发工具
- ESLint + Prettier (代码规范)
- Husky + lint-staged (Git 钩子)
- GitHub Actions (CI/CD)

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Docker & Docker Compose (用于本地开发环境)

### 安装依赖

\`\`\`bash
# 安装 pnpm (如果未安装)
npm install -g pnpm

# 安装项目依赖
pnpm install
\`\`\`

### 本地开发

\`\`\`bash
# 启动 Docker 服务 (PostgreSQL, Redis, MinIO, Coqui TTS)
docker-compose -f docker/docker-compose.dev.yml up -d

# 启动前后端开发服务器
pnpm dev

# 或分别启动
pnpm dev:frontend  # 前端开发服务器 (http://localhost:5173)
pnpm dev:backend   # 后端 API 服务器 (http://localhost:3000)
\`\`\`

### 构建生产版本

\`\`\`bash
# 构建前后端
pnpm build

# 或分别构建
pnpm build:frontend
pnpm build:backend
\`\`\`

## 项目结构

\`\`\`
SmartVoice/
├── .github/          # GitHub Actions CI/CD
├── .husky/           # Git 钩子配置
├── docs/             # 📚 项目文档
│   ├── 01-product-design/    # 产品设计文档
│   ├── 02-technical-design/  # 技术设计文档
│   └── CLAUDE.md             # Claude AI 项目说明
├── packages/         # Monorepo 代码
│   ├── frontend/     # React 前端应用
│   └── backend/      # Node.js 后端应用
├── docker/           # Docker 配置
├── scripts/          # 构建和部署脚本
└── package.json      # 根 package.json
\`\`\`

## 开发规范

### Git 提交规范 (Conventional Commits)

\`\`\`
feat: 新功能
fix: Bug 修复
docs: 文档更新
style: 代码格式
refactor: 重构
test: 测试
chore: 构建/工具链
\`\`\`

### 代码风格

- ESLint: Airbnb 规则 + 自定义规则
- Prettier: 单引号、无分号、2 空格缩进
- TypeScript: strict 模式

## 文档

详细文档请查看 [docs 目录](docs/):

- [产品规划文档](docs/01-product-design/SmartVoice/SmartVoice-plan.md)
- [技术栈选型](docs/02-technical-design/SmartVoice/tech-stack.md)
- [系统架构设计](docs/02-technical-design/SmartVoice/system-architecture.md)
- [API 设计](docs/02-technical-design/SmartVoice/api-design.md)
- [实施路线图](docs/02-technical-design/SmartVoice/implementation-roadmap.md)

## 项目状态

当前版本: **v0.1.0 (MVP 开发中)**

- ✅ 产品规划完成
- ✅ 技术选型完成
- ✅ 项目初始化完成
- 🚧 基础设施搭建中 (第 1-2 周)
- ⏳ MVP 核心功能开发 (第 3-12 周)

查看完整路线图: [实施路线图](docs/02-technical-design/SmartVoice/implementation-roadmap.md)

## 许可证

[MIT](LICENSE)

## 团队

SmartVoice Team

---

**让文字生动起来,让创作更简单** 🎙️✨
