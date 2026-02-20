"""Pydantic schemas for Tenant API."""

from pydantic import BaseModel, Field, SecretStr, field_validator

from app.domain.enums import TenantStatus


def _normalize_tenant_code(value: str) -> str:
    """Lowercase, no spaces, join with '-' (e.g. 'My Org' -> 'my-org')."""
    return "-".join(value.strip().lower().split())


class TenantCreateRequest(BaseModel):
    """Request body for POST /tenants. Only company code and name; admin user is created with a generated password."""

    code: str = Field(
        ...,
        min_length=1,
        max_length=64,
        description="Unique tenant code (normalized to lowercase, hyphen-separated slug)",
    )
    name: str = Field(..., min_length=1, max_length=255, description="Company display name")

    @field_validator("code", mode="before")
    @classmethod
    def normalize_code(cls, v: str) -> str:
        """Normalize before validation so e.g. 'My Org' becomes 'my-org'."""
        return _normalize_tenant_code(v)


class TenantCreateResponse(BaseModel):
    """Response after tenant creation. Admin password is returned once in secure form; store it securely."""

    tenant_id: str
    tenant_code: str
    tenant_name: str
    admin_username: str
    admin_email: str
    admin_initial_password: SecretStr = Field(
        ...,
        description="One-time initial admin password; store securely and do not expose in logs or UI after first use.",
    )


class TenantResponse(BaseModel):
    """Response for tenant (single)."""

    id: str
    code: str
    name: str
    status: str


class TenantListItem(BaseModel):
    """Item in list of tenants."""

    id: str
    code: str
    name: str
    status: str
