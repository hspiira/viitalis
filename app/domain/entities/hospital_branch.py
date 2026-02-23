"""HospitalBranch domain entity. Tenant-scoped, linked to hospital. Full parity with Hospital Branches.csv."""

from dataclasses import dataclass

from app.domain.exceptions import ValidationException


@dataclass
class HospitalBranchEntity:
    """Domain entity for a hospital branch."""

    id: str
    tenant_id: str
    hospital_id: str
    name: str
    address: str | None
    contact_person: str | None = None
    location: str | None = None
    remarks: str | None = None

    def validate(self) -> None:
        if not self.name or not self.name.strip():
            raise ValidationException("Branch name is required", field="name")
        if not self.hospital_id or not self.hospital_id.strip():
            raise ValidationException("Branch must belong to a hospital", field="hospital_id")

    def belongs_to_tenant(self, tenant_id: str) -> bool:
        return self.tenant_id == tenant_id
