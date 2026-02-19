"""Pydantic schemas for Reimbursement API."""

from decimal import Decimal

from pydantic import BaseModel, Field


class ReimbursementCreateRequest(BaseModel):
    claim_id: str = Field(..., min_length=1, max_length=64)
    amount: Decimal = Field(..., gt=0)
    status: str = Field(default="pending", max_length=32)


class ReimbursementUpdateRequest(BaseModel):
    status: str | None = Field(None, max_length=32)


class ReimbursementResponse(BaseModel):
    id: str
    tenant_id: str
    claim_id: str
    amount: Decimal
    status: str


class ReimbursementStatusRequest(BaseModel):
    status: str = Field(..., max_length=32)
