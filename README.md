# Security BO Agents - CA Summary

Security BO Agents プロジェクトにおける CA Summary エージェント専用のワークスペースです。要求定義から仕様書、PoC 実装までを 1 つのリポジトリに集約し、GitHub 上では https://github.com/ntaka-0303/Security-BO-Agents-CA-Summary と同期します。

## ディレクトリ構成
- `01_Requirements Definition/`: 業務／機能要件、機能詳細、テーブル定義などの上流ドキュメント
- `02_Specification/`: 個別機能仕様書と PoC アーキテクチャガイドライン
- `03_Implementation/`: PoC 実装用ワークスペース
  - `backend/`: FastAPI + SQLAlchemy ベースの API (Poetry 管理)
  - `frontend/`: Next.js 13 (App Router) フロントエンド
  - `docs/`: ローカル開発手順などの補足ドキュメント
  - `prompts/`: エージェント用プロンプト類

## セットアップ

### Docker での実行（推奨）

Docker を使用すると、依存関係のインストールなしで簡単に起動できます。

```bash
cd 03_Implementation
cp .env.example .env  # 必要に応じて編集
docker compose up --build -d
```

起動後、以下の URL でアクセスできます：
- フロントエンド: http://localhost:3000
- バックエンド API: http://localhost:8000

詳細は [DOCKER_SETUP.md](./03_Implementation/docs/DOCKER_SETUP.md) を参照してください。

### ローカル実行

1. **バックエンド**
   ```bash
   cd 03_Implementation/backend
   cp env.template .env
   pip install -e .
   uvicorn app.main:app --reload
   ```
2. **フロントエンド**
   ```bash
   cd 03_Implementation/frontend
   npm install
   npm run dev
   ```
3. **補足**: DB 初期化やシードは `03_Implementation/backend/scripts/` を参照してください。

詳細は [LOCAL_SETUP.md](./03_Implementation/docs/LOCAL_SETUP.md) を参照してください。

## 運用方針
- ドキュメント→実装の順で更新し、Pull Request ベースでレビューします。
- PoC で得られたナレッジは `docs/` か各仕様書へ必ずフィードバックします。
- リリースブランチやタグは必要に応じて別途運用してください。

## 関連リポジトリ
- Reporting QA エージェント: https://github.com/ntaka-0303/Security-BO-Agents-Reporting-QA
