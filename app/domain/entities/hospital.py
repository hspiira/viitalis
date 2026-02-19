"""Hospital domain entity. Tenant-scoped."""

from dataclasses import dataclass

from app.domain.exceptions import ValidationException


@dataclass
class HospitalEntity:
    """Domain entity for a hospital."""

    id: str
    tenant_id: str
    name: str
    address: str | None

    def validate(self) -> None:
        if not self.name or not self.name.strip():
            raise ValidationException("Hospital name is required", field="name")

    def belongs_to_tenant(self, tenant_id: str) -> bool:
        return self.tenant_id == tenant_id
