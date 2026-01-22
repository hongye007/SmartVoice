# SmartVoice 技术文档更新计划

## 背景

用户要求更新所有技术文档以反映最终架构决策:
- 存储: MinIO(自部署) + OSS(备份)
- NLP: Deepseek API(主要) + Qwen/OpenAI(备份)
- TTS: Coqui TTS(自部署) + 百度TTS(备份)
- 架构: Adapter Pattern实现服务可配置切换
- 成本: MVP ¥4,730/年(下降¥2,990)

## 需要更新的文档

### 优先级1: 核心架构文档

1. **third-party-services.md** - 最关键
   - 重写TTS部分: Coqui TTS(主要) vs 百度TTS(备份)
   - 重写NLP部分: Deepseek(主要,¥0.001/千token) vs Qwen/OpenAI
   - 新增Storage部分: MinIO vs OSS vs COS
   - 更新成本分析: MVP ¥4,730/年
   - 更新服务选型矩阵

2. **system-architecture.md**
   - 更新架构图(加入MinIO + TTS Server)
   - 新增Adapter Pattern章节
   - 更新部署架构(Docker Compose)
   - 更新服务模块设计

3. **tech-stack.md**
   - 新增MinIO到存储部分
   - 更新NLP部分(Deepseek替代OpenAI)
   - 更新决策理由(成本优化)

### 优先级2: 实施文档

4. **implementation-roadmap.md**
   - 新增MinIO部署任务(4h)
   - 新增Coqui TTS部署任务(8h)
   - 新增Adapter层开发(32h)
   - 移除Ollama相关任务
   - 更新GPU配置(单T4,仅TTS)
   - 更新成本预算

5. **overall-design.md**
   - 更新技术约束(GPU单卡)
   - 更新成本约束(¥4,730)
   - 更新技术边界

### 优先级3: 总览文档

6. **technical-design.md**
   - 更新执行摘要
   - 更新核心技术栈表格
   - 更新第三方服务表格
   - 更新成本指标
   - 更新系统架构模式说明

## 实施步骤

1. 更新 third-party-services.md(重点)
2. 更新 system-architecture.md
3. 更新 tech-stack.md
4. 更新 implementation-roadmap.md
5. 更新 overall-design.md
6. 更新 technical-design.md

## 关键内容

### Adapter Pattern架构
```typescript
// 三大服务接口
interface IStorageProvider { upload, download, delete, getSignedUrl }
interface INLPProvider { recognizeCharacters, healthCheck }
interface ITTSProvider { synthesize, getVoices, healthCheck }

// 工厂类实现自动切换
StorageFactory, NLPFactory, TTSFactory
```

### 成本对比(MVP 100项目)
| 项目 | 旧方案 | 新方案 | 节省 |
|------|--------|--------|------|
| ECS | ¥1,200 | ¥2,160(含GPU) | -¥960 |
| OSS | ¥960 | ¥0(MinIO) | +¥960 |
| TTS | ¥4,500 | ¥0(Coqui) | +¥4,500 |
| NLP | ¥100 | ¥30(Deepseek) | +¥70 |
| **总计** | **¥7,720** | **¥4,730** | **+¥2,990** |

## 验证

文档更新后应确保:
- 所有服务选型决策一致
- 成本计算准确
- 架构图完整展示新组件
- 实施路线图任务完整
