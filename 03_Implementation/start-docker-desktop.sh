#!/bin/bash
# WSL環境からDocker Desktopを起動するスクリプト

set -e

echo "=== Docker Desktop 起動スクリプト ==="
echo ""

# Docker Desktopのパス（一般的なインストール場所）
DOCKER_DESKTOP_PATHS=(
    "/mnt/c/Program Files/Docker/Docker/Docker Desktop.exe"
    "/mnt/c/Program Files (x86)/Docker/Docker/Docker Desktop.exe"
    "$HOME/AppData/Local/Docker/Docker Desktop.exe"
)

DOCKER_DESKTOP_PATH=""

# Docker Desktopの実行ファイルを探す
for path in "${DOCKER_DESKTOP_PATHS[@]}"; do
    if [ -f "$path" ]; then
        DOCKER_DESKTOP_PATH="$path"
        break
    fi
done

if [ -z "$DOCKER_DESKTOP_PATH" ]; then
    echo "エラー: Docker Desktopの実行ファイルが見つかりませんでした。"
    echo ""
    echo "以下のいずれかの方法でDocker Desktopを起動してください："
    echo "  1. Windowsのスタートメニューから「Docker Desktop」を起動"
    echo "  2. タスクバーの検索で「Docker Desktop」を検索して起動"
    echo ""
    echo "Docker Desktopが起動したら、以下のコマンドで状態を確認できます："
    echo "  docker info"
    exit 1
fi

echo "Docker Desktopを起動しています..."
echo "パス: $DOCKER_DESKTOP_PATH"
echo ""

# WSL環境からWindowsの実行ファイルを起動
cmd.exe /c start "" "$DOCKER_DESKTOP_PATH" 2>/dev/null || {
    echo "警告: コマンドラインからの起動に失敗しました。"
    echo "手動でDocker Desktopを起動してください。"
    echo ""
    echo "Docker Desktopが起動したら、以下のコマンドで状態を確認できます："
    echo "  docker info"
    exit 1
}

echo "Docker Desktopの起動を試みました。"
echo ""
echo "Docker Desktopが完全に起動するまで数秒〜数十秒かかります。"
echo "システムトレイのDockerアイコンが緑色になるまでお待ちください。"
echo ""
echo "起動状態を確認するには、以下のコマンドを実行してください："
echo "  docker info"
echo ""
echo "または、以下のスクリプトでコンテナを起動できます："
echo "  ./start-docker.sh"

