"""CompanyBranch domain entity. Tenant-scoped, linked to company."""

from dataclasses import dataclass

from app.domain.exceptions import ValidationException


@dataclass
class CompanyBranchEntity:
    """Domain entity for a company branch."""

    id: str
    tenant_id: str
    company_id: str
    name: str
    address: str | None
    phone: str | None

    def validate(self) -> None:
        """Validate branch business rules."""
        if not self.id or not self.id.strip():
            raise ValidationException("Branch ID is required", field="id")
        if not self.tenant_id or not self.tenant_id.strip():
            raise ValidationException("Branch must belong to a tenant", field="tenant_id")
        if not self.company_id or not self.company_id.strip():
            raise ValidationException("Branch must belong to a company", field="company_id")
        if not self.name or not self.name.strip():
            raise ValidationException("Branch name is required", field="name")

    def belongs_to_tenant(self, tenant_id: str) -> bool:
        """Return whether this branch belongs to the given tenant."""
        return self.tenant_id == tenant_id
