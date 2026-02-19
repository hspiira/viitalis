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


@dataclass
class MemberCreate:
    """Data required to create a member."""

    company_id: str
    scheme_id: str
    card_no: str
    name: str
    dob: date | None = None
    status: str = "active"


@dataclass
class MemberUpdate:
    """Data for partial update of a member."""

    card_no: str | None = None
    name: str | None = None
    dob: date | None = None
    status: str | None = None
