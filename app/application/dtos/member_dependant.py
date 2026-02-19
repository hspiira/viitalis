"""MemberDependant DTOs."""

from dataclasses import dataclass
from datetime import date


@dataclass
class MemberDependantResult:
    """Member dependant as returned from repository."""

    id: str
    tenant_id: str
    member_id: str
    name: str
    card_no: str | None
    dob: date | None


@dataclass
class MemberDependantCreate:
    """Data required to create a member dependant."""

    member_id: str
    name: str
    card_no: str | None = None
    dob: date | None = None


@dataclass
class MemberDependantUpdate:
    """Data for partial update of a member dependant."""

    name: str | None = None
    card_no: str | None = None
    dob: date | None = None
