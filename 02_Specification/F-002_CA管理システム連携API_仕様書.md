# 仕様書

## 1. 概要
* **ドキュメント名**：仕様書
* **対象機能**：F-002 CA管理システム連携 API
* **対応する機能要件**：機能要件定義書 F-002、機能詳細 3.2
* **担当者**：システム部 API チーム
* **前提条件**：
  - CA_NOTICE 登録済みの案件のみ処理
  - S-001 API トークンを発行済み
* **制約条件**：
  - REST/JSON のみ
  - タイムアウト 5 秒、最大再試行 3 回

---

## 2. 画面仕様
UI なし

---

## 3. 処理仕様

### 3.1 処理概要フロー
```
1. CA_NOTICE から入力パラメータ生成
2. S-001 API 呼出し（銘柄/日付情報取得）
3. 応答マッピング（F-002 データ更新）
4. エラー時リトライ／アラート
```

### 3.2 処理詳細
| 手順 | 処理内容 | 入力 | 出力 | 備考 |
| -- | -- | -- | -- | -- |
| 1 | パラメータ生成 | ca_notice_id | request JSON | |
| 2 | API 呼出 | request JSON | response JSON | REST POST |
| 3 | マッピング | response JSON | 更新値 | 銘柄補完、日付 |
| 4 | 更新反映 | 更新値 | CA_NOTICE 更新 | record_date 等 |
| 5 | 例外処理 | エラー情報 | アラート | Slack/メール |

### 3.3 業務ルール
* 銘柄コード不一致時は warning フラグを UI へ返す
* 支払開始日が未定の場合は NULL を維持

### 3.4 例外処理
* 4xx：入力不備→取込画面にエラー表示
* 5xx：3 回リトライ後、手入力フローへ移行

---

## 4. API / 外部システム連携

### 4.1 API一覧
| API ID | API名称 | IF種別 | 呼び出し方向 |
| -- | -- | -- | -- |
| API-002 | CAマスタ取得 API | REST | 本システム→S-001 |

### 4.2 リクエスト仕様
```
POST /poc/ca/v1/master
Authorization: Bearer {token}
```
```json
{
  "caNoticeId": "CA-20250331-001"
}
```

### 4.3 レスポンス仕様
```json
{
  "securityCode": "1234",
  "securityName": "○○株式会社",
  "recordDate": "2025-03-31",
  "paymentDate": "2025-06-01"
}
```

### 4.4 エラー仕様
| コード | 内容 | 対処 |
| -- | -- | -- |
| 401 | トークン無効 | 再認証 |
| 404 | データなし | UI 警告 |
| 500 | システム障害 | リトライ |

---

## 5. データ仕様

### 5.1 データ項目
| No | 論理名 | 物理名 | 型 | NULL | 説明 |
| -- | -- | -- | -- | -- | -- |
| D-001 | CA通知ID | ca_notice_id | varchar(64) | NOT NULL | |
| D-002 | 銘柄コード | security_code | varchar(10) | NOT NULL | |
| D-004 | 権利確定日 | record_date | date | NOT NULL | |
| D-005 | 支払開始日 | payment_date | date | NULL | |

### 5.2 テーブル
* **CA_NOTICE**（更新対象）
* **AI_REQUEST**（参照のみ）

---

## 6. シーケンス図
```
Scheduler/UI → F-002 API → S-001
1. 取込完了で API 呼出
2. S-001 応答
3. CA_NOTICE 更新
4. UI へ反映
```

