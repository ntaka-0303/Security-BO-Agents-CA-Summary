from __future__ import annotations

from datetime import date, datetime
from typing import List, Optional

from sqlmodel import Field, Relationship, SQLModel


class TimestampMixin(SQLModel):
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)


class CANotice(SQLModel, table=True):
    __tablename__ = "ca_notice"

    ca_notice_id: str = Field(primary_key=True, max_length=64)
    security_code: str = Field(max_length=10, index=True)
    security_name: str = Field(max_length=120)
    ca_event_type: str = Field(max_length=32)
    record_date: date
    payment_date: Optional[date] = None
    notice_text: str
    source_channel: str = Field(max_length=32, default="manual")
    notice_status: str = Field(max_length=16, default="intake")
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    ai_requests: List[AIRequest] = Relationship(back_populates="notice")  # type: ignore
    drafts: List[DraftVersion] = Relationship(back_populates="notice")  # type: ignore


class AIRequest(SQLModel, table=True):
    __tablename__ = "ai_request"

    ai_request_id: Optional[int] = Field(default=None, primary_key=True)
    ca_notice_id: str = Field(foreign_key="ca_notice.ca_notice_id")
    template_type: str = Field(max_length=32)
    customer_segment: str = Field(max_length=32)
    prompt_json: str
    created_by: str = Field(max_length=64)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    notice: CANotice = Relationship(back_populates="ai_requests")
    outputs: List[AIOutput] = Relationship(back_populates="request")


class AIOutput(SQLModel, table=True):
    __tablename__ = "ai_output"

    ai_output_id: Optional[int] = Field(default=None, primary_key=True)
    ai_request_id: int = Field(foreign_key="ai_request.ai_request_id")
    internal_summary: str
    customer_draft: str
    model_version: str = Field(max_length=32)
    risk_tokens: Optional[str] = Field(default=None, max_length=255)
    generated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    request: AIRequest = Relationship(back_populates="outputs")
    drafts: List[DraftVersion] = Relationship(back_populates="ai_output")


class DraftVersion(SQLModel, table=True):
    __tablename__ = "draft_version"

    draft_id: Optional[int] = Field(default=None, primary_key=True)
    ca_notice_id: str = Field(foreign_key="ca_notice.ca_notice_id")
    ai_output_id: Optional[int] = Field(default=None, foreign_key="ai_output.ai_output_id")
    version_no: int
    editor_id: str = Field(max_length=64)
    edited_text: str
    risk_flag: str = Field(max_length=1, default="N")
    approval_status: str = Field(max_length=16, default="pending")
    review_comment: Optional[str] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    notice: CANotice = Relationship(back_populates="drafts")
    ai_output: Optional[AIOutput] = Relationship(back_populates="drafts")
    approvals: List[ApprovalHistory] = Relationship(back_populates="draft")  # type: ignore
    distributions: List[DistributionLog] = Relationship(back_populates="draft")  # type: ignore


class ApprovalHistory(SQLModel, table=True):
    __tablename__ = "approval_history"

    approval_id: Optional[int] = Field(default=None, primary_key=True)
    draft_id: int = Field(foreign_key="draft_version.draft_id")
    approver_id: str = Field(max_length=64)
    decision: str = Field(max_length=16)
    decision_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    approval_comment: Optional[str] = None

    draft: DraftVersion = Relationship(back_populates="approvals")


class DistributionLog(SQLModel, table=True):
    __tablename__ = "distribution_log"

    distribution_id: Optional[int] = Field(default=None, primary_key=True)
    draft_id: int = Field(foreign_key="draft_version.draft_id")
    channel_type: str = Field(max_length=16)
    send_batch_id: Optional[str] = Field(default=None, max_length=64, index=True)
    distribution_status: str = Field(max_length=16, default="queued")
    sent_at: Optional[datetime] = None
    result_detail: Optional[str] = None

    draft: DraftVersion = Relationship(back_populates="distributions")


class AuditLog(SQLModel, table=True):
    __tablename__ = "audit_log"

    audit_id: str = Field(primary_key=True, max_length=64)
    entity_type: str = Field(max_length=32)
    entity_id: str = Field(max_length=64)
    action: str = Field(max_length=32)
    performed_by: str = Field(max_length=64)
    performed_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    payload_digest: str = Field(max_length=256)
