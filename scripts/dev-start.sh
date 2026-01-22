#!/bin/bash

# SmartVoice 开发环境快速启动脚本

set -e

echo "🚀 Starting SmartVoice development environment..."

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# 启动 Docker 服务
echo "📦 Starting Docker services..."
docker-compose -f docker/docker-compose.dev.yml up -d

# 等待服务就绪
echo "⏳ Waiting for services to be ready..."
sleep 5

# 检查服务状态
echo "✅ Checking service status..."
docker-compose -f docker/docker-compose.dev.yml ps

echo ""
echo "🎉 Development environment is ready!"
echo ""
echo "📍 Service URLs:"
echo "   - PostgreSQL: localhost:5432"
echo "   - Redis: localhost:6379"
echo "   - MinIO API: http://localhost:9000"
echo "   - MinIO Console: http://localhost:9001"
echo ""
echo "💡 Next steps:"
echo "   1. Copy environment files:"
echo "      cp packages/frontend/.env.example packages/frontend/.env"
echo "      cp packages/backend/.env.example packages/backend/.env"
echo ""
echo "   2. Install dependencies:"
echo "      pnpm install"
echo ""
echo "   3. Run database migrations:"
echo "      pnpm --filter backend prisma:migrate"
echo ""
echo "   4. Start development servers:"
echo "      pnpm dev"
echo ""
echo "📝 View logs:"
echo "   docker-compose -f docker/docker-compose.dev.yml logs -f"
echo ""
echo "🛑 Stop services:"
echo "   docker-compose -f docker/docker-compose.dev.yml down"
