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


@dataclass
class TenantCreationResult:
    """Result of tenant creation: tenant + admin user details and one-time password."""

    tenant_id: str
    tenant_code: str
    tenant_name: str
    admin_username: str
    admin_email: str
    admin_initial_password: str  # Generated once; return only in create response
