"""MemberDependant domain entity. Tenant-scoped, linked to member."""

from dataclasses import dataclass
from datetime import date

from app.domain.exceptions import ValidationException


@dataclass
class MemberDependantEntity:
    """Domain entity for a member's dependant."""

    id: str
    tenant_id: str
    member_id: str
    name: str
    dob: date | None

    def validate(self) -> None:
        """Validate dependant business rules."""
        if not self.id or not self.id.strip():
            raise ValidationException("Dependant ID is required", field="id")
        if not self.tenant_id or not self.tenant_id.strip():
            raise ValidationException("Dependant must belong to a tenant", field="tenant_id")
        if not self.member_id or not self.member_id.strip():
            raise ValidationException("Dependant must belong to a member", field="member_id")
        if not self.name or not self.name.strip():
            raise ValidationException("Dependant name is required", field="name")

    def belongs_to_tenant(self, tenant_id: str) -> bool:
        """Return whether this dependant belongs to the given tenant."""
        return self.tenant_id == tenant_id
