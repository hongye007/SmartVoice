# Node 环境配置技能

自动配置 Node.js 开发环境，使用 fnm 管理 Node 版本，使用 pnpm 管理包。

## 功能

- 检查并安装 fnm (Fast Node Manager)
- 配置项目使用指定的 Node 版本
- 安装 pnpm 包管理器
- 验证环境配置

## 使用场景

- 初始化新项目的开发环境
- 确保团队使用相同的 Node 版本
- 快速切换不同项目的 Node 版本
- 标准化包管理工具

## 工作流程

1. **检查 fnm**: 验证 fnm 是否已安装
2. **配置 Node 版本**:
   - 创建 .node-version 或 .nvmrc 文件
   - 使用 fnm 安装并激活指定版本
3. **安装 pnpm**: 使用 npm 全局安装 pnpm
4. **验证配置**: 检查 Node 和 pnpm 版本
5. **安装项目依赖**: 运行 pnpm install

## 支持的 Node 版本管理文件

- `.node-version` (推荐)
- `.nvmrc` (兼容 nvm)
- `package.json` 中的 `engines.node`

## 技术栈

- fnm (Fast Node Manager)
- pnpm (高效的包管理器)
- Node.js 18+
