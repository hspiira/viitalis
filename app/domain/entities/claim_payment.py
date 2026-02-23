"""ClaimPayment domain entity. Tenant-scoped, linked to claim."""

from dataclasses import dataclass
from datetime import date
from decimal import Decimal

from app.domain.exceptions import ValidationException


@dataclass
class ClaimPaymentEntity:
    id: str
    tenant_id: str
    claim_id: str
    amount: Decimal
    payment_date: date

    def validate(self) -> None:
        if not self.claim_id or not self.claim_id.strip():
            raise ValidationException("Claim is required", field="claim_id")
        if self.amount <= 0:
            raise ValidationException("Amount must be positive", field="amount")

    def belongs_to_tenant(self, tenant_id: str) -> bool:
        return self.tenant_id == tenant_id
