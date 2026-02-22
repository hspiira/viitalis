"""Member DTOs."""

from dataclasses import dataclass
from datetime import date


@dataclass
class MemberResult:
    """Member as returned from repository."""

    id: str
    tenant_id: str
    company_id: str
    scheme_id: str
    card_no: str
    name: str
    dob: date | None
    status: str
    employee_no: str | None = None
    gender: str | None = None
    address: str | None = None
    tel_home: str | None = None
    tel_mobile: str | None = None
    email: str | None = None
    department: str | None = None
    branch: str | None = None
    occupation: str | None = None
    date_of_joining: date | None = None
    date_of_leaving: date | None = None
    remarks: str | None = None
    extra: dict | None = None


@dataclass
class MemberCreate:
    """Data required to create a member."""

    company_id: str
    scheme_id: str
    card_no: str
    name: str
    dob: date | None = None
    status: str = "active"
    employee_no: str | None = None
    gender: str | None = None
    address: str | None = None
    tel_home: str | None = None
    tel_mobile: str | None = None
    email: str | None = None
    department: str | None = None
    branch: str | None = None
    occupation: str | None = None
    date_of_joining: date | None = None
    date_of_leaving: date | None = None
    remarks: str | None = None
    extra: dict | None = None


@dataclass
class MemberUpdate:
    """Data for partial update of a member."""

    card_no: str | None = None
    name: str | None = None
    dob: date | None = None
    status: str | None = None
    employee_no: str | None = None
    gender: str | None = None
    address: str | None = None
    tel_home: str | None = None
    tel_mobile: str | None = None
    email: str | None = None
    department: str | None = None
    branch: str | None = None
    occupation: str | None = None
    date_of_joining: date | None = None
    date_of_leaving: date | None = None
    remarks: str | None = None
    extra: dict | None = None
