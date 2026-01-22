# SmartVoice Frontend

SmartVoice 智能多角色有声内容创作平台 - 前端应用

## 技术栈

- React 18
- TypeScript 5
- Vite 5
- Ant Design 5
- Zustand (状态管理)
- React Router v6
- Axios
- Socket.io Client

## 开发

```bash
# 安装依赖(在项目根目录)
pnpm install

# 启动开发服务器
pnpm dev:frontend
# 或在当前目录
pnpm dev

# 构建生产版本
pnpm build:frontend
# 或在当前目录
pnpm build

# 预览生产构建
pnpm preview

# 代码检查
pnpm lint
pnpm lint:fix

# 类型检查
pnpm typecheck
```

## 项目结构

```
src/
├── assets/        # 静态资源
├── components/    # 通用组件
├── pages/         # 页面组件
├── services/      # API 服务
├── stores/        # Zustand 状态管理
├── types/         # TypeScript 类型定义
├── utils/         # 工具函数
├── App.tsx        # 根组件
├── main.tsx       # 应用入口
└── index.css      # 全局样式
```

## 环境变量

复制 `.env.example` 为 `.env` 并配置:

```bash
cp .env.example .env
```

## API 代理

开发环境下，Vite 会自动代理 `/api` 和 `/socket.io` 到后端服务器 (http://localhost:3000)。
