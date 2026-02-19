"""CompanyBranch DTOs."""

from dataclasses import dataclass


@dataclass
class CompanyBranchResult:
    """Company branch as returned from repository."""

    id: str
    tenant_id: str
    company_id: str
    name: str
    address: str | None
    phone: str | None


@dataclass
class CompanyBranchCreate:
    """Data required to create a company branch."""

    company_id: str
    name: str
    address: str | None = None
    phone: str | None = None


@dataclass
class CompanyBranchUpdate:
    """Data for partial update of a company branch."""

    name: str | None = None
    address: str | None = None
    phone: str | None = None
