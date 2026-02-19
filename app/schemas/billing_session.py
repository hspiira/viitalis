"""Pydantic schemas for billing session API."""

from datetime import date
from decimal import Decimal

from pydantic import BaseModel, Field


class BillingSessionCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    session_date: date
    from_date: date | None = None
    to_date: date | None = None
    created_by: str | None = Field(None, max_length=64)


class BillingSessionUpdateRequest(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    from_date: date | None = None
    to_date: date | None = None
    status: str | None = Field(None, pattern="^(open|closed|disabled)$")


class BillingSessionResponse(BaseModel):
    id: str
    tenant_id: str
    name: str
    session_date: date
    from_date: date | None
    to_date: date | None
    total_claims: int | None
    total_amount: Decimal | None
    status: str
    created_by: str | None


class BillingSessionListItem(BaseModel):
    id: str
    tenant_id: str
    name: str
    session_date: date
    from_date: date | None
    to_date: date | None
    total_claims: int | None
    total_amount: Decimal | None
    status: str
    created_by: str | None
