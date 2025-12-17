# CA Summary Backend - Dockerfile
FROM python:3.11-slim

WORKDIR /app

# システム依存パッケージのインストール
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# 依存関係ファイルをコピー
COPY pyproject.toml ./

# pip と依存関係のインストール
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir .

# アプリケーションコードをコピー
COPY app ./app
COPY scripts ./scripts

# データディレクトリとプロンプトディレクトリを作成
# prompts は docker-compose.yml でボリュームマウントされる
RUN mkdir -p /app/data /app/prompts

# 環境変数のデフォルト設定
ENV DATABASE_URL="sqlite:///./data/ca_summary.db"
ENV API_PREFIX="/api"
ENV APP_NAME="CA Summary Backend"

# ポート公開
EXPOSE 8000

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

# アプリケーション起動
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
