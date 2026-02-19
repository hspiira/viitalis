"""Company domain entity. Tenant-scoped."""

from dataclasses import dataclass

from app.domain.exceptions import ValidationException


@dataclass
class CompanyEntity:
    """Domain entity for company. Belongs to a tenant."""

    id: str
    tenant_id: str
    name: str
    contact_person: str | None
    address: str | None
    phone: str | None
    email: str | None
    website: str | None
    remarks: str | None
    location: str | None
    district_id: int | None
    company_type: int | None

    def validate(self) -> None:
        """Validate company business rules."""
        if not self.id or not self.id.strip():
            raise ValidationException("Company ID is required", field="id")
        if not self.tenant_id or not self.tenant_id.strip():
            raise ValidationException("Company must belong to a tenant", field="tenant_id")
        if not self.name or not self.name.strip():
            raise ValidationException("Company name is required", field="name")

    def belongs_to_tenant(self, tenant_id: str) -> bool:
        """Return whether this company belongs to the given tenant."""
        return self.tenant_id == tenant_id
