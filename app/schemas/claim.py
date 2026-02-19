"""Pydantic schemas for Claim API."""

from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class ClaimDetailCreateRequest(BaseModel):
    fee_code: str = Field(..., max_length=64)
    description: str | None = None
    unit_price: Decimal = Field(default=Decimal("0"))
    qty: int = Field(default=1, ge=1)
    amount: Decimal = Field(default=Decimal("0"))
    status: str = Field(default="pending", max_length=32)
    item_type: str | None = Field(None, pattern="^(medicine|service|lab)$")


class ClaimCreateRequest(BaseModel):
    member_id: str = Field(..., min_length=1, max_length=64)
    dependant_id: str | None = None
    hospital_id: str = Field(..., min_length=1, max_length=64)
    doctor_id: str | None = None
    service_date: date
    total_amount: Decimal | None = None
    status: str = Field(default="draft", max_length=32)
    invoice_number: str | None = Field(None, max_length=64)
    billing_session_id: str | None = Field(None, max_length=64)
    details: list[ClaimDetailCreateRequest] = Field(default_factory=list)


class ClaimUpdateRequest(BaseModel):
    service_date: date | None = None
    total_amount: Decimal | None = None
    status: str | None = Field(None, max_length=32)
    invoice_number: str | None = Field(None, max_length=64)


class ClaimResponse(BaseModel):
    id: str
    tenant_id: str
    member_id: str
    dependant_id: str | None
    hospital_id: str
    doctor_id: str | None
    service_date: date
    total_amount: Decimal | None
    status: str
    invoice_number: str | None
    approved_at: datetime | None = None
    approved_by: str | None = None
    approval_comments: str | None = None
    billing_session_id: str | None = None


class ClaimApprovalRequest(BaseModel):
    approved: bool
    approved_by: str | None = Field(None, max_length=64)
    comments: str | None = None


class ClaimBulkApprovalRequest(BaseModel):
    claim_ids: list[str] = Field(..., min_length=1)
    approved: bool
    approved_by: str | None = Field(None, max_length=64)
    comments: str | None = None


class ClaimDetailResponse(BaseModel):
    id: str
    tenant_id: str
    claim_id: str
    fee_code: str
    description: str | None
    unit_price: Decimal
    qty: int
    amount: Decimal
    status: str
