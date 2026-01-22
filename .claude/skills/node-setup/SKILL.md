# node-setup

配置 Node.js 开发环境，使用 fnm 管理 Node 版本和 pnpm 管理包

## Skill Configuration

```yaml
name: node-setup
description: 配置 Node.js 开发环境 (fnm + pnpm)
trigger: 用户需要配置或修复 Node.js 开发环境时
proactive: true
```

## 使用时机

当遇到以下情况时，**主动**使用此技能：

1. **环境问题检测**
   - pnpm 命令不存在
   - Node 版本不匹配项目要求
   - npm 全局安装命令失败

2. **项目初始化**
   - 新克隆的项目需要配置环境
   - 首次运行 `pnpm install` 失败

3. **版本管理**
   - 项目需要特定 Node 版本
   - 团队成员环境不一致

4. **明确请求**
   - 用户说"配置 Node 环境"
   - 用户说"安装 pnpm"
   - 用户说"使用 fnm"

## 技能目标

配置完整的 Node.js 开发环境，确保：
- fnm 已安装并可用
- 正确的 Node 版本已激活
- pnpm 已全局安装
- 项目依赖已安装

## 执行步骤

### 1. 检查 fnm 是否安装

```bash
# 检查 fnm 命令
command -v fnm
```

**如果未安装**，根据操作系统提供安装指令：

**macOS/Linux:**
```bash
curl -fsSL https://fnm.vercel.app/install | bash
```

**然后添加到 shell 配置：**

**对于 zsh (~/.zshrc):**
```bash
eval "$(fnm env --use-on-cd)"
```

**对于 bash (~/.bashrc):**
```bash
eval "$(fnm env --use-on-cd)"
```

### 2. 确定目标 Node 版本

**优先级顺序：**
1. `.node-version` 文件
2. `.nvmrc` 文件
3. `package.json` 中的 `engines.node`
4. 默认使用 LTS (18.x)

**读取版本文件：**
```bash
# 检查 .node-version
cat .node-version

# 检查 .nvmrc
cat .nvmrc

# 检查 package.json
cat package.json | grep -A 1 '"engines"'
```

### 3. 创建 .node-version 文件（如果不存在）

```bash
# 创建文件指定 Node 18 LTS
echo "18" > .node-version
```

### 4. 使用 fnm 安装并激活 Node 版本

```bash
# 安装指定版本
fnm install

# 使用该版本
fnm use

# 验证版本
node --version
```

### 5. 检查 pnpm 是否安装

```bash
# 检查 pnpm 命令
command -v pnpm
```

**如果未安装**，使用 npm 全局安装：

```bash
npm install -g pnpm
```

### 6. 验证 pnpm 安装

```bash
pnpm --version
```

### 7. 安装项目依赖

```bash
# 安装依赖
pnpm install
```

### 8. 报告配置结果

总结配置完成的信息：
- Node 版本
- pnpm 版本
- 依赖安装状态
- 下一步操作建议

## 错误处理

### fnm 安装失败
- 检查网络连接
- 提供手动安装链接：https://github.com/Schniz/fnm
- 建议使用 brew (macOS): `brew install fnm`

### Node 版本安装失败
- 检查指定的版本是否有效
- 尝试使用 LTS 版本
- 清理 fnm 缓存：`fnm uninstall <version>`

### pnpm 安装失败
- 检查 npm 是否可用
- 尝试使用 npm 更新自身：`npm install -g npm`
- 使用 corepack 安装：`corepack enable pnpm`

### 依赖安装失败
- 清理缓存：`pnpm store prune`
- 删除 node_modules 和 pnpm-lock.yaml 重试
- 检查 package.json 中是否有损坏的依赖

## 示例对话

**场景 1: 检测到 pnpm 不存在**

```
用户: 运行 pnpm install
助手: 检测到 pnpm 命令不存在。我来帮您配置 Node 环境。

[执行 node-setup 技能]

助手: ✅ Node 环境配置完成
- Node 版本: v18.19.0
- pnpm 版本: 8.15.1
- 项目依赖已安装

现在可以运行开发命令了：
- pnpm dev
- pnpm build
```

**场景 2: 主动检测环境问题**

```
用户: 启动项目
助手: 检测到项目需要 Node 18，但当前是 Node 16。我来配置正确的环境。

[执行 node-setup 技能]

助手: ✅ 已切换到 Node 18.19.0
项目环境已就绪，正在启动...
```

## 注意事项

1. **Shell 配置生效**: fnm 安装后需要重启终端或 source shell 配置文件
2. **全局权限**: pnpm 全局安装可能需要 sudo (Linux)
3. **版本文件**: 优先创建 .node-version 而非 .nvmrc
4. **团队协作**: 将 .node-version 提交到 Git
5. **CI/CD**: 在 CI 配置中也要使用 fnm 和 pnpm

## 成功标准

配置完成后应满足：
- ✅ `fnm --version` 返回版本号
- ✅ `node --version` 返回正确版本
- ✅ `pnpm --version` 返回版本号
- ✅ `node_modules` 目录存在
- ✅ 可以运行 `pnpm dev` 或其他脚本

## 相关文档

- [fnm GitHub](https://github.com/Schniz/fnm)
- [pnpm 官方文档](https://pnpm.io/)
- [Node.js 版本管理最佳实践](https://nodejs.org/en/download/package-manager)
