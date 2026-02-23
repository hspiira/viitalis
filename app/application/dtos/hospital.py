"""Hospital and HospitalBranch DTOs. Full parity with Hospitals.csv / Hospital Branches.csv."""

from dataclasses import dataclass


@dataclass
class HospitalResult:
    id: str
    tenant_id: str
    name: str
    address: str | None
    code: str | None
    reference: str | None
    contact_person: str | None
    phone: str | None
    email: str | None
    website: str | None
    remarks: str | None
    district_id: int | None
    outpatient_capacity: int | None
    inpatient_capacity: int | None
    out_or_in_patient: str | None
    dental: bool | None
    status: str


@dataclass
class HospitalCreate:
    name: str
    address: str | None = None
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
    out_or_in_patient: str | None = None
    dental: bool | None = None
    status: str = "active"


@dataclass
class HospitalUpdate:
    name: str | None = None
    address: str | None = None
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
    out_or_in_patient: str | None = None
    dental: bool | None = None
    status: str | None = None


@dataclass
class HospitalBranchResult:
    id: str
    tenant_id: str
    hospital_id: str
    name: str
    address: str | None
    contact_person: str | None
    location: str | None
    remarks: str | None


@dataclass
class HospitalBranchCreate:
    hospital_id: str
    name: str
    address: str | None = None
    contact_person: str | None = None
    location: str | None = None
    remarks: str | None = None


@dataclass
class HospitalBranchUpdate:
    name: str | None = None
    address: str | None = None
    contact_person: str | None = None
    location: str | None = None
    remarks: str | None = None
