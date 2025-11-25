"""サンプルデータ投入スクリプト。`python scripts/seed_sample.py` で実行。"""

import sys
from datetime import date, datetime
from pathlib import Path

# プロジェクトルートをパスに追加
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.db.session import get_session, init_db
from app.db.models import CANotice, AIRequest, AIOutput, DraftVersion


SAMPLE_NOTICES = [
    {
        "ca_notice_id": "CA-2024-001",
        "security_code": "7203",
        "security_name": "トヨタ自動車株式会社",
        "ca_event_type": "配当",
        "record_date": date(2024, 3, 31),
        "payment_date": date(2024, 6, 1),
        "notice_text": """当社は、2024年3月期の期末配当金を1株につき90円とすることを決定いたしました。
配当金のお受取方法につきましては、株式数比例配分方式をご利用のお客様は自動的に証券口座へ入金されます。
登録配当金受領口座方式のお客様は指定の口座へ振り込まれます。
なお、配当基準日は2024年3月31日、支払開始日は2024年6月1日を予定しております。""",
        "source_channel": "manual",
        "notice_status": "intake",
    },
    {
        "ca_notice_id": "CA-2024-002",
        "security_code": "6758",
        "security_name": "ソニーグループ株式会社",
        "ca_event_type": "株式分割",
        "record_date": date(2024, 9, 30),
        "payment_date": None,
        "notice_text": """当社は、2024年10月1日を効力発生日として、1株につき5株の割合で株式分割を実施いたします。
分割後の発行済株式総数は6,250,000,000株となります。
株主の皆様におかれましては、特段のお手続きは必要ございません。
分割後の株式は、保有株数に応じて自動的に割り当てられます。""",
        "source_channel": "external_api",
        "notice_status": "intake",
    },
    {
        "ca_notice_id": "CA-2024-003",
        "security_code": "9984",
        "security_name": "ソフトバンクグループ株式会社",
        "ca_event_type": "減配",
        "record_date": date(2024, 6, 30),
        "payment_date": date(2024, 9, 1),
        "notice_text": """当社は、2024年度中間配当について、業績見通しの下方修正に伴い、
1株当たり配当金を従来予想の50円から22円へ減配することを決定いたしました。
株主の皆様には誠に申し訳ございませんが、経営環境の変化に対応するための措置として
ご理解賜りますようお願い申し上げます。
詳細は当社IRページをご確認ください。""",
        "source_channel": "manual",
        "notice_status": "intake",
    },
]


def seed_notices(session) -> None:
    """サンプル通知データを投入"""
    for data in SAMPLE_NOTICES:
        existing = session.get(CANotice, data["ca_notice_id"])
        if existing:
            print(f"  Skip (exists): {data['ca_notice_id']}")
            continue
        notice = CANotice(**data)
        session.add(notice)
        print(f"  Created: {data['ca_notice_id']} - {data['security_name']}")
    session.commit()


def seed_ai_output_and_draft(session) -> None:
    """サンプルAI出力とドラフトを投入"""
    notice = session.get(CANotice, "CA-2024-001")
    if not notice:
        print("  Notice CA-2024-001 not found, skipping AI output seed")
        return

    # 既存のAIリクエストがあればスキップ
    from sqlmodel import select
    existing_req = session.exec(
        select(AIRequest).where(AIRequest.ca_notice_id == "CA-2024-001")
    ).first()
    if existing_req:
        print("  Skip AI output (exists)")
        return

    # AIリクエスト作成
    ai_request = AIRequest(
        ca_notice_id="CA-2024-001",
        template_type="standard",
        customer_segment="retail",
        prompt_json="{}",
        created_by="seed_script",
    )
    session.add(ai_request)
    session.commit()
    session.refresh(ai_request)

    # AI出力作成
    ai_output = AIOutput(
        ai_request_id=ai_request.ai_request_id,
        internal_summary="""トヨタ自動車の期末配当に関する通知
・1株90円の配当決定
・配当基準日: 2024/3/31
・支払開始日: 2024/6/1""",
        customer_draft="""リテールのお客様各位

トヨタ自動車株式会社より「配当」に関するご案内です。
権利確定日は 2024-03-31、支払開始日は 2024-06-01 です。

当社は、2024年3月期の期末配当金を1株につき90円とすることを決定いたしました。
配当金のお受取方法につきましては、株式数比例配分方式をご利用のお客様は自動的に証券口座へ入金されます。

ご不明点がございましたら担当窓口までお問い合わせください。""",
        model_version="seed-v1",
        risk_tokens=None,
    )
    session.add(ai_output)
    session.commit()
    session.refresh(ai_output)
    print(f"  Created AI output: {ai_output.ai_output_id}")

    # ドラフト作成
    draft = DraftVersion(
        ca_notice_id="CA-2024-001",
        ai_output_id=ai_output.ai_output_id,
        version_no=1,
        editor_id="seed_script",
        edited_text=ai_output.customer_draft,
        risk_flag="N",
        approval_status="pending",
        review_comment="シードデータによる初期ドラフト",
    )
    session.add(draft)
    session.commit()
    print(f"  Created draft: {draft.draft_id}")

    # 通知ステータス更新
    notice.notice_status = "ai-generated"
    session.add(notice)
    session.commit()


def main() -> None:
    print("Initializing database...")
    init_db()

    print("\nSeeding sample notices...")
    with get_session() as session:
        seed_notices(session)

    print("\nSeeding AI output and draft...")
    with get_session() as session:
        seed_ai_output_and_draft(session)

    print("\nSeed completed!")


if __name__ == "__main__":
    main()
