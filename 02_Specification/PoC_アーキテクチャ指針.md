# CA 情報要約 PoC アーキテクチャ指針

## 1. 方針概要
- PoC 期間内に軽量かつ迅速に構築することを目的とし、クラウド依存を避けた Docker Compose ベースの一体環境を採用。
- 認証や複雑な権限管理はスコープ外とし、UI は誰でもアクセス可能な前提で設計。
- 将来拡張（本番化・SSO・スケールアウト）を見据えつつ、現段階では最小限のコンポーネントで一気通貫フローを実現する。

## 2. 技術スタックと役割
| レイヤ | 技術 | 役割 |
| --- | --- | --- |
| フロントエンド | Next.js (App Router) + TypeScript + Tailwind CSS | UI-CA-001〜004、管理 UI（UI-CA-ADM）を素早く実装。SWR 等で API 連携。 |
| バックエンド | FastAPI (Python) | BFF として UI からの REST リクエストを処理。pydantic で I/O スキーマを共有し仕様書の整合性を担保。 |
| AI 連携 | LangChain + OpenAI 互換 API | F-003/F-004 のプロンプト生成・推論実行。テンプレ／メタ情報を Python 側で管理。 |
| DB | PostgreSQL | テーブル定義書の CA_NOTICE / DRAFT_VERSION / AI_REQUEST 等を実装。JSONB で原文・生成文を格納。 |
| 非同期処理 | Celery + Redis | F-008 の配信再送や Webhook 処理、バッチ的なリトライを軽量に実現。 |
| インフラ | Docker Compose | `frontend`/`backend`/`db`/`redis`/`worker` コンテナを一括起動。 |

## 3. 構成イメージ
```
┌──────────┐        ┌─────────┐        ┌────────────┐
│ Frontend │─REST→│ FastAPI │─SQL→│ PostgreSQL │
└──────────┘        │  (BFF)  │        └────────────┘
        │            │   │  │
        │            │   │  ├─LLM API（LangChain 経由）
        │            │   └─▶Celery Worker (Redis Queue)
        │            │           │
        │            └──Webhook/配信API（S-003, mock S-004）
```

## 4. 仕様との対応
- **F-001/F-003/F-005/F-007/UI-CA-ADM**：Next.js ページで画面仕様を再現。テンプレの項目・エラー文言をそのままフォームに実装。
- **F-002/F-003/F-004/F-006/F-008**：FastAPI のサービス層にロジックを集約。仕様書の処理フローに合わせ、pydantic モデルでリクエスト／レスポンスを定義。
- **データ構造**：PostgreSQL でテーブル定義書 (CA_NOTICE, AI_REQUEST, AI_OUTPUT, DRAFT_VERSION, APPROVAL_HISTORY, DISTRIBUTION_LOG, AUDIT_LOG) を実装し、D-001〜D-012 のデータ項目と一致させる。
- **リスク判定 (F-006)**：FastAPI サービス＋設定ファイル（JSON/YAML）でスコアリングし、結果を DRAFT_VERSION へ反映。
- **承認・配信 (F-007/F-008)**：ワークフロー／通知配信システムは REST Mock で代替し、PoC では DB に履歴を保持。Celery で配信ステータスの再送・ポーリングを担当。
- **監査ログ (F-009)**：FastAPI ミドルウェアで各アクションを捕捉し AUDIT_LOG に記録、将来の WORM/SIEM 連携も差し替え可能。

## 5. 実装ステップ案
1. Docker Compose で Next.js / FastAPI / PostgreSQL / Redis / Celery Worker の骨格を作成。
2. FastAPI にテーブルマイグレーション（SQLAlchemy + Alembic）と pydantic スキーマを定義し、仕様書の API 入出力をそのまま反映。
3. Next.js で画面ワイヤーフレームを Tailwind で迅速に作成し、機能詳細書の入力チェック・エラーを実装。
4. LangChain + OpenAI 互換 API で F-003/F-004 のプロンプト管理と LLM 応答を実装、危険ワードフィルタを Python で実装。
5. Celery タスクで配信 API（F-008）の再送／Webhook 処理を PoC レベルで整備。
6. 監査ログ・リスク判定・承認連携など横断機能を追加し、シナリオテストを実施。

## 6. 特記事項
- 認証・SSO・ID 管理は PoC スコープ外。今後本番化する際に認証ミドルを差し込めるよう、API ヘッダでトークンを受け取る構造のみ確保。
- 運用監視は最低限（コンテナログ＋簡易メトリクス）。PoC の安定度を見るため必要に応じて `docker logs` や簡易ダッシュボードを利用。
- LLM API は社内ポリシーに従い、OpenAI 互換エンドポイントまたは社内モデルを切替可能な設定ファイルで管理。

## 7. 期待効果
- フロントとバックエンドを TypeScript/Python のモダンスタックに統一することで、迅速な PoC 開発と将来の拡張性を両立。
- Celery + Redis により F-008/F-009 等の非同期要件も最小コストで実装可能。
- テンプレ・仕様書・テーブル定義との整合を FastAPI/pydantic で担保し、PoC でも実データに近い振る舞いを確認できる。

