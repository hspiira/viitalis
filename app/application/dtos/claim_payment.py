"""ClaimPayment DTOs."""

from dataclasses import dataclass
from datetime import date
from decimal import Decimal


@dataclass
class ClaimPaymentResult:
    id: str
    tenant_id: str
    claim_id: str
    amount: Decimal
    payment_date: date


@dataclass
class ClaimPaymentCreate:
    claim_id: str
    amount: Decimal
    payment_date: date
