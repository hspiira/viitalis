"""Claim and ClaimDetail DTOs."""

from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal


@dataclass
class ClaimResult:
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
    approved_at: datetime | None
    approved_by: str | None
    approval_comments: str | None


@dataclass
class ClaimCreate:
    member_id: str
    hospital_id: str
    service_date: date
    dependant_id: str | None = None
    doctor_id: str | None = None
    total_amount: Decimal | None = None
    status: str = "draft"
    invoice_number: str | None = None


@dataclass
class ClaimUpdate:
    service_date: date | None = None
    total_amount: Decimal | None = None
    status: str | None = None
    invoice_number: str | None = None


@dataclass
class ClaimDetailResult:
    id: str
    tenant_id: str
    claim_id: str
    fee_code: str
    description: str | None
    unit_price: Decimal
    qty: int
    amount: Decimal
    status: str


@dataclass
class ClaimDetailCreate:
    fee_code: str
    description: str | None = None
    unit_price: Decimal = Decimal("0")
    qty: int = 1
    amount: Decimal = Decimal("0")
    status: str = "pending"
