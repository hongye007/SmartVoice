# SmartVoice Docker 配置

本目录包含 SmartVoice 项目的 Docker 配置文件。

## 开发环境

### 启动服务

```bash
# 从项目根目录运行
docker-compose -f docker/docker-compose.dev.yml up -d

# 查看日志
docker-compose -f docker/docker-compose.dev.yml logs -f

# 停止服务
docker-compose -f docker/docker-compose.dev.yml down

# 停止并删除数据
docker-compose -f docker/docker-compose.dev.yml down -v
```

### 服务列表

- **PostgreSQL** (端口 5432)
  - 用户名: `postgres`
  - 密码: `postgres`
  - 数据库: `smartvoice`

- **Redis** (端口 6379)
  - 无密码

- **MinIO** (对象存储)
  - API: http://localhost:9000
  - Console: http://localhost:9001
  - 用户名: `minioadmin`
  - 密码: `minioadmin`
  - Bucket: `smartvoice`

- **Coqui TTS** (端口 5002) - 需要 GPU
  - 默认注释掉,如有 GPU 可取消注释

### 数据持久化

数据存储在 Docker volumes:
- `postgres_data` - PostgreSQL 数据
- `redis_data` - Redis 数据
- `minio_data` - MinIO 文件

## 生产环境

### 构建镜像

```bash
# 构建前端镜像
docker build -f docker/Dockerfile.frontend -t smartvoice-frontend .

# 构建后端镜像
docker build -f docker/Dockerfile.backend -t smartvoice-backend .
```

### 运行容器

```bash
# 运行前端
docker run -d -p 80:80 --name smartvoice-frontend smartvoice-frontend

# 运行后端(需要连接到数据库)
docker run -d -p 3000:3000 \
  --name smartvoice-backend \
  -e DATABASE_URL="postgresql://..." \
  -e REDIS_HOST="..." \
  smartvoice-backend
```

## 健康检查

所有服务都配置了健康检查,可以使用以下命令查看状态:

```bash
docker-compose -f docker/docker-compose.dev.yml ps
```

## 网络

所有服务运行在同一个 Docker 网络 `smartvoice-network` 中,可以通过服务名相互访问。

例如,后端可以通过 `postgres:5432` 访问数据库。

## 故障排查

### 端口冲突

如果端口已被占用,修改 docker-compose.dev.yml 中的端口映射:

```yaml
ports:
  - '5433:5432'  # 改为其他端口
```

### 查看日志

```bash
# 查看所有服务日志
docker-compose -f docker/docker-compose.dev.yml logs

# 查看特定服务日志
docker-compose -f docker/docker-compose.dev.yml logs postgres
docker-compose -f docker/docker-compose.dev.yml logs redis
docker-compose -f docker/docker-compose.dev.yml logs minio
```

### 重新创建服务

```bash
docker-compose -f docker/docker-compose.dev.yml up -d --force-recreate
```
