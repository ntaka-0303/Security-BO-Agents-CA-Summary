# テーブル定義：CA 情報要約・通知文ドラフト生成

## 1. CA_NOTICE
| 項目名 | 物理名 | 型 | 桁数 | PK | FK | Nullable | 説明 |
| -- | -- | -- | -- | -- | -- | -- | -- |
| CA通知ID | ca_notice_id | varchar | 64 | ○ | - | NOT NULL | D-001、全体キー |
| 銘柄コード | security_code | varchar | 10 | - | - | NOT NULL | D-002 |
| 銘柄名 | security_name | varchar | 120 | - | - | NOT NULL | 表示用 |
| CA種別 | ca_event_type | varchar | 32 | - | - | NOT NULL | D-003 |
| 権利確定日 | record_date | date | - | - | - | NOT NULL | D-004 |
| 支払開始日 | payment_date | date | - | - | - | NULL | D-005 |
| 原文テキスト | notice_text | text | - | - | - | NOT NULL | D-006 |
| ソースチャネル | source_channel | varchar | 32 | - | - | NOT NULL | メール/ベンダー等 |
| 状態 | notice_status | varchar | 16 | - | - | NOT NULL | `intake`,`in-progress` 等 |
| 作成日時 | created_at | timestamp | - | - | - | NOT NULL | |
| 更新日時 | updated_at | timestamp | - | - | - | NOT NULL | |

## 2. AI_REQUEST
| 項目名 | 物理名 | 型 | 桁数 | PK | FK | Nullable | 説明 |
| -- | -- | -- | -- | -- | -- | -- | -- |
| リクエストID | ai_request_id | bigint | - | ○ | - | NOT NULL | 自動採番 |
| CA通知ID | ca_notice_id | varchar | 64 | - | FK→CA_NOTICE | NOT NULL | |
| テンプレ種別 | template_type | varchar | 32 | - | - | NOT NULL | |
| 顧客セグメント | customer_segment | varchar | 32 | - | - | NOT NULL | 個人/法人 等 |
| プロンプト JSON | prompt_json | jsonb | - | - | - | NOT NULL | F-003 生成 |
| 作成者 | created_by | varchar | 64 | - | - | NOT NULL | ユーザーID |
| 作成日時 | created_at | timestamp | - | - | - | NOT NULL | |

## 3. AI_OUTPUT
| 項目名 | 物理名 | 型 | 桁数 | PK | FK | Nullable | 説明 |
| -- | -- | -- | -- | -- | -- | -- | -- |
| 出力ID | ai_output_id | bigint | - | ○ | - | NOT NULL | |
| リクエストID | ai_request_id | bigint | - | FK→AI_REQUEST | NOT NULL | |
| 社内向け要約 | internal_summary | text | - | - | - | NOT NULL | D-007 |
| 顧客向けドラフト | customer_draft | text | - | - | - | NOT NULL | D-008 |
| モデルバージョン | model_version | varchar | 32 | - | - | NOT NULL | |
| リスクトークン | risk_tokens | varchar | 255 | - | - | NULL | 有害表現検知 |
| 生成日時 | generated_at | timestamp | - | - | - | NOT NULL | |

## 4. DRAFT_VERSION
| 項目名 | 物理名 | 型 | 桁数 | PK | FK | Nullable | 説明 |
| -- | -- | -- | -- | -- | -- | -- | -- |
| ドラフトID | draft_id | bigint | - | ○ | - | NOT NULL | |
| CA通知ID | ca_notice_id | varchar | 64 | - | FK→CA_NOTICE | NOT NULL | |
| 出力ID | ai_output_id | bigint | - | FK→AI_OUTPUT | NULL | AI未使用時はNULL |
| バージョン番号 | version_no | int | - | - | - | NOT NULL | D-009 |
| 編集者ID | editor_id | varchar | 64 | - | - | NOT NULL | |
| 編集本文 | edited_text | text | - | - | - | NOT NULL | 修正済み文 |
| リスクフラグ | risk_flag | char | 1 | - | - | NOT NULL | D-010 |
| 承認ステータス | approval_status | varchar | 16 | - | - | NOT NULL | D-011 |
| コメント | review_comment | text | - | - | - | NULL | |
| 更新日時 | updated_at | timestamp | - | - | - | NOT NULL | |

## 5. APPROVAL_HISTORY
| 項目名 | 物理名 | 型 | 桁数 | PK | FK | Nullable | 説明 |
| -- | -- | -- | -- | -- | -- | -- | -- |
| 承認ID | approval_id | bigint | - | ○ | - | NOT NULL | |
| ドラフトID | draft_id | bigint | - | FK→DRAFT_VERSION | NOT NULL | |
| 承認者ID | approver_id | varchar | 64 | - | - | NOT NULL | |
| 判断 | decision | varchar | 16 | - | - | NOT NULL | `approved/rejected` |
| 判断日時 | decision_at | timestamp | - | - | - | NOT NULL | |
| コメント | approval_comment | text | - | - | - | NULL | 差戻し理由など |

## 6. DISTRIBUTION_LOG
| 項目名 | 物理名 | 型 | 桁数 | PK | FK | Nullable | 説明 |
| -- | -- | -- | -- | -- | -- | -- | -- |
| 配信ID | distribution_id | bigint | - | ○ | - | NOT NULL | |
| ドラフトID | draft_id | bigint | - | FK→DRAFT_VERSION | NOT NULL | |
| チャネル種別 | channel_type | varchar | 16 | - | - | NOT NULL | 郵送/電子 |
| 配信バッチID | send_batch_id | varchar | 64 | - | - | NULL | S-003 連携ID |
| ステータス | distribution_status | varchar | 16 | - | - | NOT NULL | success 等 |
| 配信日時 | sent_at | timestamp | - | - | - | NULL | |
| 結果詳細 | result_detail | text | - | - | - | NULL | エラー時メモ |

## 7. AUDIT_LOG
| 項目名 | 物理名 | 型 | 桁数 | PK | FK | Nullable | 説明 |
| -- | -- | -- | -- | -- | -- | -- | -- |
| 監査ID | audit_id | varchar | 64 | ○ | - | NOT NULL | D-012 |
| 対象種別 | entity_type | varchar | 32 | - | - | NOT NULL | NOTICE/DRAFT 等 |
| 対象ID | entity_id | varchar | 64 | - | - | NOT NULL | |
| 操作種別 | action | varchar | 32 | - | - | NOT NULL | CREATE/UPDATE 等 |
| 実施者 | performed_by | varchar | 64 | - | - | NOT NULL | user_id or system |
| 実施日時 | performed_at | timestamp | - | - | - | NOT NULL | |
| 変更サマリ | payload_digest | varchar | 256 | - | - | NOT NULL | ハッシュ/差分 |

## 8. インデックス・制約方針
* `CA_NOTICE.security_code` に検索用インデックス
* `DRAFT_VERSION.ca_notice_id + version_no` にユニーク制約（最新抽出）
* `DISTRIBUTION_LOG.send_batch_id` にユニーク制約（null 許容）
* 外部キーは ON UPDATE CASCADE、ON DELETE RESTRICT を基本とする


