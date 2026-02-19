"""Plan DTOs."""

from dataclasses import dataclass


@dataclass
class PlanResult:
    """Plan as returned from repository."""

    id: str
    tenant_id: str
    name: str
    code: str | None


@dataclass
class PlanCreate:
    """Data required to create a plan."""

    name: str
    code: str | None = None


@dataclass
class PlanUpdate:
    """Data for partial update of a plan."""

    name: str | None = None
    code: str | None = None
