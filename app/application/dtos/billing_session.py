"""DTOs for billing session."""

from dataclasses import dataclass
from datetime import date
from decimal import Decimal


@dataclass
class BillingSessionResult:
    id: str
    tenant_id: str
    name: str
    session_date: date
    from_date: date | None
    to_date: date | None
    total_claims: int | None
    total_amount: Decimal | None
    status: str
    created_by: str | None


@dataclass
class BillingSessionCreate:
    name: str
    session_date: date
    from_date: date | None = None
    to_date: date | None = None
    created_by: str | None = None


@dataclass
class BillingSessionUpdate:
    name: str | None = None
    from_date: date | None = None
    to_date: date | None = None
    status: str | None = None
