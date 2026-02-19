"""Plan domain entity. Tenant-scoped."""

from dataclasses import dataclass

from app.domain.exceptions import ValidationException


@dataclass
class PlanEntity:
    """Domain entity for plan (e.g. benefit plan)."""

    id: str
    tenant_id: str
    name: str
    code: str | None

    def validate(self) -> None:
        """Validate plan business rules."""
        if not self.id or not self.id.strip():
            raise ValidationException("Plan ID is required", field="id")
        if not self.tenant_id or not self.tenant_id.strip():
            raise ValidationException("Plan must belong to a tenant", field="tenant_id")
        if not self.name or not self.name.strip():
            raise ValidationException("Plan name is required", field="name")

    def belongs_to_tenant(self, tenant_id: str) -> bool:
        """Return whether this plan belongs to the given tenant."""
        return self.tenant_id == tenant_id
