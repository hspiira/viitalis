"""DTOs for card replacement reason and card replacement."""

from dataclasses import dataclass
from datetime import datetime


@dataclass
class CardReplacementReasonResult:
    id: str
    tenant_id: str
    name: str
    code: str | None
    status: str


@dataclass
class CardReplacementReasonCreate:
    name: str
    code: str | None = None
    status: str = "active"


@dataclass
class CardReplacementReasonUpdate:
    name: str | None = None
    code: str | None = None
    status: str | None = None


@dataclass
class CardReplacementResult:
    id: str
    tenant_id: str
    member_id: str | None
    dependant_id: str | None
    reason_id: str
    old_card_no: str | None
    new_card_no: str | None
    requested_at: datetime
    status: str


@dataclass
class CardReplacementCreate:
    member_id: str | None = None
    dependant_id: str | None = None
    reason_id: str = ""
    old_card_no: str | None = None
    new_card_no: str | None = None
    status: str = "requested"


@dataclass
class CardReplacementUpdate:
    """For updating status and optionally new_card_no (e.g. on approve)."""
    status: str | None = None
    new_card_no: str | None = None
