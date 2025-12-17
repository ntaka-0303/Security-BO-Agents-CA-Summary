from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel import Session, func, select

from app import dependencies
from app.config import settings
from app.db.models import DraftVersion

router = APIRouter(prefix=f"{settings.api_prefix}/dashboard", tags=["dashboard"])


class WorkflowStats(BaseModel):
    """業務フロー統計情報"""
    intake_count: int  # 取込待ち
    draft_count: int  # ドラフト作成
    review_waiting_count: int  # レビュー待ち（ドラフト完了、承認待ち）
    approval_waiting_count: int  # 承認待ち
    approved_count: int  # 承認完了
    rejected_count: int  # 却下
    high_risk_count: int  # 高リスク案件


@router.get("/workflow-stats", response_model=WorkflowStats)
def get_workflow_stats(session: Session = Depends(dependencies.get_db)) -> WorkflowStats:
    """
    業務フローの統計情報を取得
    各ステータス別の件数を返す
    """
    # ドラフト状態の件数
    draft_count = session.exec(
        select(func.count(DraftVersion.draft_id)).where(DraftVersion.approval_status == "draft")
    ).one()
    
    # レビュー待ち（pendingステータス）の件数
    review_waiting_count = session.exec(
        select(func.count(DraftVersion.draft_id)).where(DraftVersion.approval_status == "pending")
    ).one()
    
    # 承認完了の件数
    approved_count = session.exec(
        select(func.count(DraftVersion.draft_id)).where(DraftVersion.approval_status == "approved")
    ).one()
    
    # 却下の件数
    rejected_count = session.exec(
        select(func.count(DraftVersion.draft_id)).where(DraftVersion.approval_status == "rejected")
    ).one()
    
    # 高リスク案件の件数
    high_risk_count = session.exec(
        select(func.count(DraftVersion.draft_id)).where(DraftVersion.risk_flag == "Y")
    ).one()
    
    # 取込待ちと承認待ちは暫定的にレビュー待ちと同じ処理
    # 実装が進むに応じてca_noticeのステータスと連携する
    intake_count = 0
    approval_waiting_count = review_waiting_count
    
    return WorkflowStats(
        intake_count=intake_count,
        draft_count=draft_count,
        review_waiting_count=review_waiting_count,
        approval_waiting_count=approval_waiting_count,
        approved_count=approved_count,
        rejected_count=rejected_count,
        high_risk_count=high_risk_count,
    )

