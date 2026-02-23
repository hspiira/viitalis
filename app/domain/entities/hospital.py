"""Hospital domain entity. Tenant-scoped. Full parity with Hospitals.csv."""

from dataclasses import dataclass

from app.domain.exceptions import ValidationException


@dataclass
class HospitalEntity:
    """Domain entity for a hospital."""

    id: str
    tenant_id: str
    name: str
    address: str | None
    code: str | None = None
    reference: str | None = None
    contact_person: str | None = None
    phone: str | None = None
    email: str | None = None
    website: str | None = None
    remarks: str | None = None
    district_id: int | None = None
    outpatient_capacity: int | None = None
    inpatient_capacity: int | None = None
    out_or_in_patient: str | None = None  # BOTH, OUT, IN
    dental: bool | None = None
    status: str = "active"

    def validate(self) -> None:
        if not self.name or not self.name.strip():
            raise ValidationException("Hospital name is required", field="name")

    def belongs_to_tenant(self, tenant_id: str) -> bool:
        return self.tenant_id == tenant_id
