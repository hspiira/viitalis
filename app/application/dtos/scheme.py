"""Scheme DTOs."""

from dataclasses import dataclass
from datetime import date


@dataclass
class SchemeResult:
    """Scheme as returned from repository."""

    id: str
    tenant_id: str
    company_id: str
    name: str
    description: str | None
    limit_value: float | None
    begin_date: date | None
    end_date: date | None
    termination_date: date | None
    status: str


@dataclass
class SchemeCreate:
    """Data required to create a scheme."""

    company_id: str
    name: str
    description: str | None = None
    limit_value: float | None = None
    begin_date: date | None = None
    end_date: date | None = None
    termination_date: date | None = None
    status: str = "active"


@dataclass
class SchemeUpdate:
    """Data for partial update of a scheme."""

    name: str | None = None
    description: str | None = None
    limit_value: float | None = None
    begin_date: date | None = None
    end_date: date | None = None
    termination_date: date | None = None
    status: str | None = None


@dataclass
class SchemePlanResult:
    """SchemePlan link as returned from repository."""

    id: str
    tenant_id: str
    scheme_id: str
    plan_id: str


@dataclass
class SchemePlanCreate:
    """Data required to link a plan to a scheme."""

    scheme_id: str
    plan_id: str
