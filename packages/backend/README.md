# SmartVoice Backend

SmartVoice 智能多角色有声内容创作平台 - 后端 API 服务

## 技术栈

- Node.js 18
- Express 4
- TypeScript 5
- Prisma (ORM)
- PostgreSQL 14
- Redis 7
- Bull (任务队列)
- Socket.io (WebSocket)
- JWT (身份认证)
- Winston (日志)

## 开发

```bash
# 安装依赖(在项目根目录)
pnpm install

# 复制环境变量
cp .env.example .env
# 然后编辑 .env 配置数据库等信息

# 生成 Prisma Client
pnpm --filter backend prisma:generate

# 运行数据库迁移
pnpm --filter backend prisma:migrate

# 启动开发服务器
pnpm dev:backend
# 或在当前目录
pnpm dev

# 构建生产版本
pnpm build:backend
# 或在当前目录
pnpm build

# 启动生产服务器
pnpm start

# 代码检查
pnpm lint
pnpm lint:fix

# 类型检查
pnpm typecheck

# Prisma Studio (数据库可视化)
pnpm prisma:studio
```

## 项目结构

```
src/
├── config/        # 配置文件
├── controllers/   # 控制器(处理 HTTP 请求)
├── services/      # 业务逻辑层
├── middlewares/   # 中间件(认证、错误处理等)
├── routes/        # 路由定义
├── workers/       # Bull Worker(异步任务)
├── utils/         # 工具函数
├── types/         # TypeScript 类型定义
├── app.ts         # Express 应用配置
└── index.ts       # 服务器入口
```

## 环境变量

复制 `.env.example` 为 `.env` 并配置:

```bash
cp .env.example .env
```

必须配置的环境变量:
- `DATABASE_URL` - PostgreSQL 连接字符串
- `REDIS_HOST`, `REDIS_PORT` - Redis 配置
- `JWT_SECRET` - JWT 密钥(生产环境必须修改)
- `MINIO_*` - MinIO 对象存储配置
- `COQUI_TTS_URL` - Coqui TTS 服务地址
- `DEEPSEEK_API_KEY` - Deepseek NLP API 密钥

## API 文档

查看完整 API 文档: [API 设计文档](../../docs/02-technical-design/SmartVoice/api-design.md)

### 核心端点

- `GET /health` - 健康检查
- `GET /api` - API 信息
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/projects` - 获取项目列表
- `POST /api/projects` - 创建项目

## 数据库

使用 Prisma ORM 管理数据库:

```bash
# 生成 Prisma Client
pnpm prisma:generate

# 创建迁移
pnpm prisma:migrate

# 打开 Prisma Studio
pnpm prisma:studio
```

## 日志

日志文件位置:
- `logs/combined.log` - 所有日志
- `logs/error.log` - 错误日志

## 部署

生产环境部署:

```bash
# 构建
pnpm build

# 运行迁移
pnpm prisma:migrate

# 启动服务(使用 PM2)
pm2 start dist/index.js --name smartvoice-api
```
