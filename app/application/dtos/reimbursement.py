"""Reimbursement DTOs."""

from dataclasses import dataclass
from decimal import Decimal


@dataclass
class ReimbursementResult:
    id: str
    tenant_id: str
    claim_id: str
    amount: Decimal
    status: str


@dataclass
class ReimbursementCreate:
    claim_id: str
    amount: Decimal
    status: str = "pending"


@dataclass
class ReimbursementUpdate:
    status: str | None = None
