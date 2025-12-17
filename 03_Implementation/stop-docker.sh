#!/bin/bash
# WSL環境でDockerコンテナを停止するスクリプト

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# docker-composeコマンドを確認
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
else
    echo "エラー: docker-composeがインストールされていません。"
    exit 1
fi

echo "コンテナを停止しています..."
$DOCKER_COMPOSE_CMD down

echo "コンテナを停止しました。"

