"""Member domain entity. Tenant-scoped, linked to company and scheme."""

from dataclasses import dataclass
from datetime import date

from app.domain.exceptions import ValidationException


@dataclass
class MemberEntity:
    """Domain entity for a scheme member."""

    id: str
    tenant_id: str
    company_id: str
    scheme_id: str
    card_no: str
    name: str
    dob: date | None
    status: str

    def validate(self) -> None:
        """Validate member business rules."""
        if not self.id or not self.id.strip():
            raise ValidationException("Member ID is required", field="id")
        if not self.tenant_id or not self.tenant_id.strip():
            raise ValidationException("Member must belong to a tenant", field="tenant_id")
        if not self.company_id or not self.company_id.strip():
            raise ValidationException("Member must belong to a company", field="company_id")
        if not self.scheme_id or not self.scheme_id.strip():
            raise ValidationException("Member must belong to a scheme", field="scheme_id")
        if not self.name or not self.name.strip():
            raise ValidationException("Member name is required", field="name")

    def belongs_to_tenant(self, tenant_id: str) -> bool:
        """Return whether this member belongs to the given tenant."""
        return self.tenant_id == tenant_id
