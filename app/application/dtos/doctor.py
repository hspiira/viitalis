"""Doctor DTOs. Full parity with Doctors.csv."""

from dataclasses import dataclass
from datetime import date


@dataclass
class DoctorResult:
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


@dataclass
class DoctorCreate:
    hospital_id: str
    name: str
    specialization: str | None = None
    reference: str | None = None
    date_of_birth: date | None = None
    address: str | None = None
    phone_home: str | None = None
    phone_mobile: str | None = None
    licence_no: str | None = None
    department: str | None = None
    doctor_category: str | None = None
    email: str | None = None
    website: str | None = None
    gender: str | None = None
    remarks: str | None = None
    service_charges: float | None = None
    channeling_charges: float | None = None
    referring_charges: float | None = None


@dataclass
class DoctorUpdate:
    name: str | None = None
    specialization: str | None = None
    reference: str | None = None
    date_of_birth: date | None = None
    address: str | None = None
    phone_home: str | None = None
    phone_mobile: str | None = None
    licence_no: str | None = None
    department: str | None = None
    doctor_category: str | None = None
    email: str | None = None
    website: str | None = None
    gender: str | None = None
    remarks: str | None = None
    service_charges: float | None = None
    channeling_charges: float | None = None
    referring_charges: float | None = None
