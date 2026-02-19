"""ClaimDetail domain entity. Tenant-scoped, linked to claim."""

from dataclasses import dataclass
from decimal import Decimal

from app.domain.exceptions import ValidationException


@dataclass
class ClaimDetailEntity:
    id: str
    tenant_id: str
    claim_id: str
    fee_code: str
    description: str | None
    unit_price: Decimal
    qty: int
    amount: Decimal
    status: str

    def validate(self) -> None:
        if not self.claim_id or not self.claim_id.strip():
            raise ValidationException("Claim is required", field="claim_id")
        if not self.fee_code or not self.fee_code.strip():
            raise ValidationException("Fee code is required", field="fee_code")
        if self.qty < 1:
            raise ValidationException("Quantity must be at least 1", field="qty")

    def belongs_to_tenant(self, tenant_id: str) -> bool:
        return self.tenant_id == tenant_id
