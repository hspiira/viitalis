"""Scheme domain entity. Tenant-scoped, linked to company."""

from dataclasses import dataclass
from datetime import date

from app.domain.exceptions import ValidationException


@dataclass
class SchemeEntity:
    """Domain entity for scheme. Belongs to a tenant and company."""

    id: str
    tenant_id: str
    company_id: str
    name: str
    description: str | None
    limit_value: float | None
    begin_date: date | None
    end_date: date | None
    termination_date: date | None
    status: str

    def validate(self) -> None:
        """Validate scheme business rules."""
        if not self.id or not self.id.strip():
            raise ValidationException("Scheme ID is required", field="id")
        if not self.tenant_id or not self.tenant_id.strip():
            raise ValidationException("Scheme must belong to a tenant", field="tenant_id")
        if not self.company_id or not self.company_id.strip():
            raise ValidationException("Scheme must belong to a company", field="company_id")
        if not self.name or not self.name.strip():
            raise ValidationException("Scheme name is required", field="name")

    def belongs_to_tenant(self, tenant_id: str) -> bool:
        """Return whether this scheme belongs to the given tenant."""
        return self.tenant_id == tenant_id
