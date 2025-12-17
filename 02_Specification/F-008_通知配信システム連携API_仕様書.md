# 仕様書

## 1. 概要
* **ドキュメント名**：仕様書
* **対象機能**：F-008 通知配信システム連携 API
* **対応する機能要件**：機能要件定義書 F-008、機能詳細 3.8
* **担当者**：システム部 通知配信チーム
* **前提条件**：DRAFT_VERSION.approval_status = approved
* **制約条件**：REST + MQ ハイブリッド、配信失敗時最大 2 回再送

---

## 2. 画面仕様
UI なし（バックエンド連携）。配信状況は別ダッシュボードで表示予定。

---

## 3. 処理仕様

### 3.1 処理概要
```
1. 承認完了トリガー受領
2. PDF/HTML 生成
3. S-003 API へ送信 + MQ へバックアップ投入
4. 配信結果ポーリング or Webhook 受信
5. DISTRIBUTION_LOG 更新、失敗時リトライ
```

### 3.2 処理詳細
| 手順 | 内容 | 入力 | 出力 |
| -- | -- | -- | -- |
| 1 | トリガー受領 | draft_id | 配信ジョブ生成 |
| 2 | ドキュメント生成 | edited_text | PDF/HTML |
| 3 | API 呼出 | payload | response |
| 4 | 結果処理 | response/Webhook | status |
| 5 | ログ更新 | status | DISTRIBUTION_LOG |
| 6 | リトライ | failed status | 再送キュー |

### 3.3 業務ルール
* approved 以外は送信不能
* チャネル別テンプレ（郵送/電子）で出力形式を切替
* 失敗ステータス連続 3 回でアラート

### 3.4 例外処理
* API 500 → 5 分後再送、最大 2 回
* MQ 投入失敗 → ジョブを再度エンキュー

---

## 4. API / 外部連携

### 4.1 API一覧
| API ID | 名称 | IF種別 | 呼び出し方向 |
| -- | -- | -- | -- |
| API-008 | 配信登録 API (S-003) | REST | 本システム→S-003 |
| API-009 | 配信結果 Webhook | REST | S-003→本システム |

### 4.2 リクエスト（API-008）
```http
POST /poc/distribution/v1/jobs
Content-Type: application/json
```
```json
{
  "draftId": 102,
  "channel": "email",
  "document": {
    "format": "PDF",
    "contentBase64": "..."
  },
  "metadata": {
    "paymentDate": "2025-06-01",
    "securityCode": "1234"
  }
}
```

### 4.3 レスポンス
```json
{
  "jobId": "DIST-20251118-0001",
  "status": "queued"
}
```

### 4.4 エラー
| コード | 内容 | 対処 |
| -- | -- | -- |
| 400 | パラメータ不正 | 再生成 |
| 409 | 既に送信済み | 再送停止 |
| 503 | 配信システム停止 | 再送待ち |

---

## 5. データ仕様
### 5.1 項目
| No | 論理名 | 物理名 |
| -- | -- | -- |
| D-006 | 原文テキスト | notice_text |
| D-008 | 顧客ドラフト | customer_draft |
| D-011 | 承認ステータス | approval_status |
| D-012 | 監査ログID | audit_id |

### 5.2 テーブル
* **DISTRIBUTION_LOG**（distribution_id, draft_id, channel_type, send_batch_id, distribution_status, sent_at, result_detail）
* **AUDIT_LOG**（配信操作記録）

---

## 6. シーケンス図
```
F-007 → F-008 → S-003 → Webhook → F-008 → DB
```

