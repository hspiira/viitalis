"""Hospital and HospitalBranch DTOs."""

from dataclasses import dataclass


@dataclass
class HospitalResult:
    id: str
    tenant_id: str
    name: str
    address: str | None


@dataclass
class HospitalCreate:
    name: str
    address: str | None = None


@dataclass
class HospitalUpdate:
    name: str | None = None
    address: str | None = None


@dataclass
class HospitalBranchResult:
    id: str
    tenant_id: str
    hospital_id: str
    name: str
    address: str | None


@dataclass
class HospitalBranchCreate:
    hospital_id: str
    name: str
    address: str | None = None


@dataclass
class HospitalBranchUpdate:
    name: str | None = None
    address: str | None = None
