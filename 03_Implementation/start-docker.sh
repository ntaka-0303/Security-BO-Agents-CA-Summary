#!/bin/bash
# WSL環境でDockerコンテナを起動するスクリプト

set -e

echo "=== CA Summary Agent - Docker起動スクリプト ==="
echo ""

# 現在のディレクトリを確認
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Dockerが利用可能か確認
if ! command -v docker &> /dev/null; then
    echo "エラー: Dockerがインストールされていません。"
    echo "WSL環境でDockerを使用するには、以下のいずれかを実行してください："
    echo "  1. Docker Desktopをインストールし、WSL2バックエンドを有効にする"
    echo "  2. WSL内にDockerを直接インストールする"
    exit 1
fi

# Docker daemonが起動しているか確認
if ! docker info &> /dev/null; then
    echo "エラー: Docker daemonが起動していません。"
    echo "Docker Desktopを起動するか、WSL内でDockerサービスを起動してください："
    echo "  sudo service docker start"
    exit 1
fi

echo "✓ Docker環境の確認完了"
echo ""

# docker-composeコマンドを確認（docker compose または docker-compose）
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
else
    echo "エラー: docker-composeがインストールされていません。"
    exit 1
fi

echo "✓ Docker Composeの確認完了"
echo ""

# コンテナをビルドして起動
echo "コンテナをビルドして起動しています..."
$DOCKER_COMPOSE_CMD up --build -d

echo ""
echo "=== 起動完了 ==="
echo ""
echo "以下のURLでアクセスできます："
echo "  - フロントエンド: http://localhost:3000"
echo "  - バックエンド API: http://localhost:8000"
echo "  - API ドキュメント: http://localhost:8000/api/openapi.json"
echo "  - ヘルスチェック: http://localhost:8000/health"
echo ""
echo "コンテナの状態を確認: $DOCKER_COMPOSE_CMD ps"
echo "ログを確認: $DOCKER_COMPOSE_CMD logs -f"
echo "停止: $DOCKER_COMPOSE_CMD down"

