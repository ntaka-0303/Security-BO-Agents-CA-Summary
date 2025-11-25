# Docker 実行手順

CA Summary PoC を Docker で動かすためのセットアップ手順です。

## 前提条件

| 種別 | 推奨バージョン | 備考 |
| --- | --- | --- |
| Docker | 24.0 以上 | `docker --version` で確認 |
| Docker Compose | 2.20 以上 | `docker compose version` で確認 |

## クイックスタート

### 1. 環境変数の設定（オプション）

AI API を使用する場合は、環境変数ファイルを作成してください。

```bash
cd 03_Implementation
cp .env.example .env
```

`.env` ファイルを編集して、AI API キーなどを設定します。

```env
# AI API 設定
AI_BASE_URL=https://api.openai.com/v1/chat/completions
AI_MODEL=gpt-4o-mini
AI_API_KEY=your-actual-api-key-here
```

### 2. コンテナのビルドと起動

```bash
cd 03_Implementation
docker compose up --build -d
```

### 3. 動作確認

コンテナが正常に起動したことを確認します。

```bash
docker compose ps
```

以下のURLでアクセスできます：

| サービス | URL | 説明 |
| --- | --- | --- |
| フロントエンド | http://localhost:3000 | Next.js アプリケーション |
| バックエンド API | http://localhost:8000 | FastAPI サーバー |
| API ドキュメント | http://localhost:8000/api/openapi.json | OpenAPI スキーマ |
| ヘルスチェック | http://localhost:8000/health | API ヘルスチェック |

## よく使うコマンド

### コンテナの停止

```bash
docker compose down
```

### コンテナの再起動

```bash
docker compose restart
```

### ログの確認

```bash
# すべてのサービスのログ
docker compose logs -f

# バックエンドのみ
docker compose logs -f backend

# フロントエンドのみ
docker compose logs -f frontend
```

### コンテナの再ビルド（コード変更後）

```bash
docker compose up --build -d
```

### データベースの初期化

コンテナ内でデータベースを初期化する場合：

```bash
docker compose exec backend python scripts/init_db.py
```

サンプルデータを投入する場合：

```bash
docker compose exec backend python scripts/seed_sample.py
```

### データの永続化について

SQLite データベースは Docker ボリューム `backend-data` に永続化されます。
データを完全にリセットしたい場合は、ボリュームも削除してください。

```bash
docker compose down -v
```

## トラブルシューティング

### ポートが既に使用されている

```bash
# 使用中のポートを確認
lsof -i :3000
lsof -i :8000

# 別のポートで起動する場合は docker-compose.yml を編集
# または環境変数で上書き
HOST_FRONTEND_PORT=3001 HOST_BACKEND_PORT=8001 docker compose up -d
```

### コンテナが起動しない

```bash
# ログを確認
docker compose logs backend
docker compose logs frontend

# コンテナの状態を確認
docker compose ps -a
```

### ビルドキャッシュをクリアして再ビルド

```bash
docker compose build --no-cache
docker compose up -d
```

## 開発時の Tips

### バックエンドのみ起動

フロントエンドはローカルで `npm run dev` を実行したい場合：

```bash
docker compose up backend -d
```

### ホットリロード付きで開発

開発時は、ローカル環境でバックエンドとフロントエンドを別々に起動することを推奨します。
詳細は [LOCAL_SETUP.md](./LOCAL_SETUP.md) を参照してください。

## アーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                        Docker Network                        │
│  ┌──────────────────┐          ┌──────────────────────────┐ │
│  │    Frontend      │          │        Backend           │ │
│  │   (Next.js)      │  ──────▶ │       (FastAPI)          │ │
│  │   Port: 3000     │   HTTP   │       Port: 8000         │ │
│  └──────────────────┘          │                          │ │
│                                │   ┌─────────────────┐    │ │
│                                │   │  SQLite DB      │    │ │
│                                │   │ (Volume Mount)  │    │ │
│                                │   └─────────────────┘    │ │
│                                └──────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```
