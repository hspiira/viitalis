"""Doctor DTOs."""

from dataclasses import dataclass


@dataclass
class DoctorResult:
    id: str
    tenant_id: str
    hospital_id: str
    name: str
    specialization: str | None


@dataclass
class DoctorCreate:
    hospital_id: str
    name: str
    specialization: str | None = None


@dataclass
class DoctorUpdate:
    name: str | None = None
    specialization: str | None = None
