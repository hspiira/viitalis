"""Pydantic schemas for ClaimPayment API."""

from datetime import date
from decimal import Decimal

from pydantic import BaseModel, Field


class ClaimPaymentCreateRequest(BaseModel):
    claim_id: str = Field(..., min_length=1, max_length=64)
    amount: Decimal = Field(..., gt=0)
    payment_date: date


class ClaimPaymentResponse(BaseModel):
    id: str
    tenant_id: str
    claim_id: str
    amount: Decimal
    payment_date: date
