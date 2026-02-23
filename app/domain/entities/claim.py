"""Claim domain entity. Tenant-scoped, links member, hospital, doctor."""

from dataclasses import dataclass
from datetime import date
from decimal import Decimal

from app.domain.exceptions import ValidationException


@dataclass
class ClaimEntity:
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

    def validate(self) -> None:
        if not self.member_id or not self.member_id.strip():
            raise ValidationException("Member is required", field="member_id")
        if not self.hospital_id or not self.hospital_id.strip():
            raise ValidationException("Hospital is required", field="hospital_id")
        if not self.service_date:
            raise ValidationException("Service date is required", field="service_date")
        # service_date not in future
        from datetime import date as date_type
        if self.service_date > date_type.today():
            raise ValidationException("Service date cannot be in the future", field="service_date")

    def belongs_to_tenant(self, tenant_id: str) -> bool:
        return self.tenant_id == tenant_id
