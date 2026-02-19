"""Tenant DTOs for application layer."""

from dataclasses import dataclass


@dataclass
class TenantResult:
    """Tenant as returned from repository (read)."""

    id: str
    code: str
    name: str
    status: str


@dataclass
class TenantCreate:
    """Data required to create a tenant."""

    code: str
    name: str
    status: str = "active"
