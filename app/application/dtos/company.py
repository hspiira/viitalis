"""Company DTOs."""

from dataclasses import dataclass


@dataclass
class CompanyResult:
    """Company as returned from repository."""

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
    status: str


@dataclass
class CompanyCreate:
    """Data required to create a company."""

    name: str
    id: str | None = None  # optional; if set (e.g. legacy code), used as primary key
    contact_person: str | None = None
    address: str | None = None
    phone: str | None = None
    email: str | None = None
    website: str | None = None
    remarks: str | None = None
    location: str | None = None
    district_id: int | None = None
    company_type: int | None = None
    status: str | None = None


@dataclass
class CompanyUpdate:
    """Data for partial update of a company."""

    name: str | None = None
    contact_person: str | None = None
    address: str | None = None
    phone: str | None = None
    email: str | None = None
    website: str | None = None
    remarks: str | None = None
    location: str | None = None
    district_id: int | None = None
    company_type: int | None = None
    status: str | None = None
