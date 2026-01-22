# Coqui TTS 本地部署指南

本指南介绍如何在本地部署 Coqui TTS 服务，为 SmartVoice 提供语音合成能力。

## 方案概述

**Coqui TTS** 是一个开源的文本转语音（TTS）系统，支持多语言和多种声音模型。通过本地部署，可以：

- ✅ 完全免费，无 API 调用费用
- ✅ 数据隐私，不依赖云端服务
- ✅ 可定制，支持训练自定义音色
- ⚠️ 需要 GPU 加速（推荐但非必须）
- ⚠️ 初次启动需要下载模型文件（约 300MB-1GB）

## 方式一：使用 Docker 部署（推荐）

### 1. 安装 Docker

确保已安装 Docker 和 Docker Compose。

### 2. 创建 docker-compose.yml

在项目根目录创建 `docker-compose.coqui.yml`:

```yaml
version: '3.8'

services:
  coqui-tts:
    image: ghcr.io/coqui-ai/tts:latest
    container_name: smartvoice-coqui-tts
    ports:
      - "5002:5002"
    environment:
      - TTS_MODEL=tts_models/zh-CN/baker/tacotron2-DDC
      - TTS_VOCODER=vocoder_models/universal/libri-tts/fullband-melgan
    volumes:
      - coqui-models:/root/.local/share/tts
    restart: unless-stopped
    # 如果有 NVIDIA GPU，启用 GPU 加速
    # deploy:
    #   resources:
    #     reservations:
    #       devices:
    #         - driver: nvidia
    #           count: 1
    #           capabilities: [gpu]

volumes:
  coqui-models:
```

### 3. 启动服务

```bash
docker-compose -f docker-compose.coqui.yml up -d
```

### 4. 验证服务

```bash
# 检查服务状态
curl http://localhost:5002/

# 测试语音合成
curl -X POST http://localhost:5002/api/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "你好，这是测试", "speaker_id": "tts_models/zh-CN/baker/tacotron2-DDC"}' \
  --output test.wav
```

## 方式二：使用 Python 直接部署

### 1. 安装 Python 环境

需要 Python 3.8 或更高版本。

```bash
# 安装 Coqui TTS
pip install TTS

# 或使用 conda
conda create -n tts python=3.9
conda activate tts
pip install TTS
```

### 2. 下载中文模型

```bash
# 下载中文 TTS 模型
tts --list_models  # 查看可用模型

# 下载 Baker 中文模型（女声）
tts --model_name tts_models/zh-CN/baker/tacotron2-DDC \
    --text "测试" \
    --out_path test.wav
```

### 3. 启动 TTS Server

```bash
# 启动服务器（监听 5002 端口）
tts-server --model_name tts_models/zh-CN/baker/tacotron2-DDC \
           --port 5002 \
           --use_cuda false  # 如果有 GPU，设置为 true
```

### 4. 使用 systemd 管理服务（Linux）

创建 `/etc/systemd/system/coqui-tts.service`:

```ini
[Unit]
Description=Coqui TTS Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/coqui-tts
ExecStart=/usr/local/bin/tts-server \
    --model_name tts_models/zh-CN/baker/tacotron2-DDC \
    --port 5002 \
    --use_cuda false
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

启动服务:

```bash
sudo systemctl daemon-reload
sudo systemctl enable coqui-tts
sudo systemctl start coqui-tts
sudo systemctl status coqui-tts
```

## 配置 SmartVoice

在 `packages/backend/.env` 中配置 Coqui TTS 地址:

```env
# Coqui TTS (Self-hosted TTS)
COQUI_TTS_URL=http://localhost:5002
```

## 可用的中文模型

Coqui TTS 支持的中文模型：

| 模型名称 | 音色 | 质量 | 速度 |
|---------|------|------|------|
| `tts_models/zh-CN/baker/tacotron2-DDC` | 女声 | ⭐⭐⭐⭐ | 快 |
| `tts_models/zh-CN/baker/tacotron2` | 女声 | ⭐⭐⭐ | 中 |

## 性能优化建议

### 1. 使用 GPU 加速

如果有 NVIDIA GPU，安装 CUDA 和 cuDNN:

```bash
# 安装 PyTorch with CUDA
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# 启动时启用 CUDA
tts-server --model_name tts_models/zh-CN/baker/tacotron2-DDC \
           --port 5002 \
           --use_cuda true
```

### 2. 使用更快的 Vocoder

Vocoder 负责生成最终音频，可以选择更快的模型：

```bash
# 使用 MelGAN（速度快，质量略低）
tts-server --model_name tts_models/zh-CN/baker/tacotron2-DDC \
           --vocoder_name vocoder_models/universal/libri-tts/fullband-melgan \
           --port 5002
```

### 3. 模型缓存

首次运行时会下载模型，后续启动会使用缓存：

- Linux/Mac: `~/.local/share/tts/`
- Windows: `%USERPROFILE%\.local\share\tts\`

## 故障排除

### 问题 1: 连接被拒绝

```
Error: ECONNREFUSED 127.0.0.1:5002
```

**解决方法:**
- 确认 Coqui TTS 服务已启动: `docker ps` 或 `systemctl status coqui-tts`
- 检查端口占用: `netstat -tuln | grep 5002`

### 问题 2: 合成速度慢

**解决方法:**
- 启用 GPU 加速
- 使用更快的 Vocoder 模型
- 减少批处理文本长度

### 问题 3: 模型下载失败

**解决方法:**
- 手动下载模型并放置到缓存目录
- 使用国内镜像加速

### 问题 4: 内存不足

**解决方法:**
- 限制 Docker 内存使用
- 使用更小的模型
- 增加系统 swap 空间

## 替代方案

如果 Coqui TTS 不满足需求，可以考虑：

1. **讯飞语音合成 (Xfyun)** - 云端服务，质量高，需要付费
   - 配置方法参见 `docs/deployment/xfyun-tts-setup.md`

2. **百度语音合成** - 云端服务，有免费额度
   - 需要实现 `baidu-tts.adapter.ts`

3. **其他开源 TTS**:
   - **Mozilla TTS**: Coqui TTS 的前身
   - **PaddleSpeech**: 百度开源的中文 TTS
   - **VITS**: 高质量端到端 TTS

## 参考资源

- [Coqui TTS GitHub](https://github.com/coqui-ai/TTS)
- [Coqui TTS 文档](https://tts.readthedocs.io/)
- [预训练模型列表](https://github.com/coqui-ai/TTS/wiki/Released-Models)
- [中文模型训练教程](https://github.com/coqui-ai/TTS/wiki/Training-Chinese-TTS)

## 生产环境建议

对于生产环境，建议：

1. **负载均衡**: 部署多个 TTS 实例
2. **监控告警**: 监控服务健康状态和响应时间
3. **备用方案**: 配置云端 TTS 作为 fallback
4. **缓存策略**: 缓存常用文本的音频结果
5. **资源限制**: 限制并发请求数和内存使用

## 成本估算

### 本地部署成本（Coqui TTS）

- **硬件投入**:
  - CPU 版本: 免费（使用现有服务器）
  - GPU 版本: 需要 NVIDIA GPU（推荐 RTX 3060 或更高）

- **运维成本**:
  - 电费: 约 ¥50-200/月（取决于使用频率）
  - 维护: 自行维护，无额外费用

### 云端服务成本（讯飞）

- **API 调用费用**: ¥0.1-0.3/千字
- **预估月费用**:
  - 10 万字/月: ¥10-30
  - 100 万字/月: ¥100-300
  - 1000 万字/月: ¥1000-3000

**结论**: 如果月调用量超过 50 万字，本地部署更经济。
