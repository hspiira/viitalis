"""Doctor domain entity. Tenant-scoped, linked to hospital. Full parity with Doctors.csv."""

from dataclasses import dataclass
from datetime import date

from app.domain.exceptions import ValidationException


@dataclass
class DoctorEntity:
    """Domain entity for a doctor."""

    id: str
    tenant_id: str
    hospital_id: str
    name: str
    specialization: str | None
    reference: str | None
    date_of_birth: date | None
    address: str | None
    phone_home: str | None
    phone_mobile: str | None
    licence_no: str | None
    department: str | None
    doctor_category: str | None
    email: str | None
    website: str | None
    gender: str | None
    remarks: str | None
    service_charges: float | None
    channeling_charges: float | None
    referring_charges: float | None

    def validate(self) -> None:
        if not self.name or not self.name.strip():
            raise ValidationException("Doctor name is required", field="name")
        if not self.hospital_id or not self.hospital_id.strip():
            raise ValidationException("Doctor must belong to a hospital", field="hospital_id")

    def belongs_to_tenant(self, tenant_id: str) -> bool:
        return self.tenant_id == tenant_id
