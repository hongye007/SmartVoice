# AI 增强功能使用说明

## 概述

SmartVoice 现已集成 DeepSeek AI，可以显著提升角色识别的准确率。

## 功能特点

### 1. 智能角色识别
- **规则匹配**: 基于正则表达式快速识别对话和角色
- **AI 增强**: 当规则识别结果不理想时（角色数 < 3），自动使用 AI 补充识别
- **混合模式**: 结合规则和 AI 的优点，既保证速度又提升准确率

### 2. 性别识别
- AI 可以根据角色名称和对话内容推断性别
- 支持 MALE、FEMALE、UNKNOWN 三种状态

### 3. 成本控制
- 仅在必要时调用 AI（角色识别不足时）
- 仅分析前 3 章节内容（约 2000 字）
- 采用较低的 temperature（0.3）确保结果稳定

## API 使用方法

### 解析项目（带 AI 增强）

```bash
POST /api/projects/:projectId/parse
Content-Type: application/json
Authorization: Bearer {token}

{
  "useAI": true  // 可选，默认 true
}
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "summary": {
      "chapterCount": 2,
      "characterCount": 4,
      "dialogueCount": 14
    },
    "characters": [
      {
        "name": "张三",
        "gender": "MALE",
        "dialogueCount": 0
      }
    ]
  }
}
```

### 禁用 AI 增强

如果只想使用规则匹配：

```bash
POST /api/projects/:projectId/parse
Content-Type: application/json

{
  "useAI": false
}
```

## 配置说明

### 环境变量 (.env)

```bash
# DeepSeek API 配置
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxx
DEEPSEEK_API_URL=https://api.deepseek.com
```

### 配置文件 (config/index.ts)

```typescript
deepseek: {
  apiKey: process.env.DEEPSEEK_API_KEY || '',
  apiUrl: process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com',
}
```

## 实现原理

### 工作流程

1. **规则解析**: 首先使用正则表达式快速识别对话和角色
2. **结果评估**: 检查识别出的角色数量
3. **AI 增强**: 如果角色数 < 3，调用 DeepSeek AI 补充识别
4. **结果合并**: 将 AI 识别的角色与规则识别的角色合并（去重）

### 核心服务

- **TextParser**: 基础规则解析服务
- **EnhancedTextParser**: AI 增强解析服务
- **DeepSeekService**: DeepSeek API 调用封装

## 测试结果

### 测试用例

**测试文本**: 包含 4 个角色（张三、李四、王五、赵六）的对话小说

| 解析方式 | 识别角色数 | 性别准确率 | 耗时 |
|---------|----------|----------|-----|
| 纯规则匹配 | 0 | N/A | < 1s |
| AI 增强 | 4 | 75% | ~6s |

**结论**: AI 增强显著提升了角色识别准确率，特别适合复杂文本。

## 成本估算

### DeepSeek API 定价
- deepseek-chat: ¥0.001/千 tokens
- 平均每次解析消耗: ~2000 tokens
- 单次成本: 约 ¥0.002

### 优化建议
1. 仅在角色识别不足时启用 AI
2. 限制分析的文本长度（当前 2000 字）
3. 缓存 AI 识别结果避免重复调用

## 未来改进

- [ ] 支持更多 AI 模型（GPT-4, Claude 等）
- [ ] 增加对话情绪识别
- [ ] 支持角色关系图谱分析
- [ ] 提供 AI 识别置信度评分

## 常见问题

### Q: AI 增强是否会影响解析速度？
A: 会增加 5-10 秒的解析时间，但大幅提升准确率。可以通过 `useAI: false` 禁用。

### Q: API Key 安全吗？
A: API Key 存储在 .env 文件中，不会提交到代码仓库（已在 .gitignore 中）。

### Q: 没有 API Key 能用吗？
A: 可以，系统会自动回退到纯规则匹配模式。

### Q: 如何获取 DeepSeek API Key？
A: 访问 https://platform.deepseek.com/ 注册并获取。
