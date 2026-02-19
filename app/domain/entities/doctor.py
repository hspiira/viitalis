"""Doctor domain entity. Tenant-scoped, linked to hospital."""

from dataclasses import dataclass

from app.domain.exceptions import ValidationException


@dataclass
class DoctorEntity:
    """Domain entity for a doctor."""

    id: str
    tenant_id: str
    hospital_id: str
    name: str
    specialization: str | None

    def validate(self) -> None:
        if not self.name or not self.name.strip():
            raise ValidationException("Doctor name is required", field="name")
        if not self.hospital_id or not self.hospital_id.strip():
            raise ValidationException("Doctor must belong to a hospital", field="hospital_id")

    def belongs_to_tenant(self, tenant_id: str) -> bool:
        return self.tenant_id == tenant_id
