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

## ローカルセットアップ
1. **バックエンド**
   ```bash
   cd 03_Implementation/backend
   cp env.template .env
   poetry install
   poetry run uvicorn app.main:app --reload
   ```
2. **フロントエンド**
   ```bash
   cd 03_Implementation/frontend
   corepack enable
   pnpm install
   pnpm dev
   ```
3. **補足**: DB 初期化やシードは `03_Implementation/backend/scripts/` を参照してください。

## 運用方針
- ドキュメント→実装の順で更新し、Pull Request ベースでレビューします。
- PoC で得られたナレッジは `docs/` か各仕様書へ必ずフィードバックします。
- リリースブランチやタグは必要に応じて別途運用してください。

## 関連リポジトリ
- Reporting QA エージェント: https://github.com/ntaka-0303/Security-BO-Agents-Reporting-QA
