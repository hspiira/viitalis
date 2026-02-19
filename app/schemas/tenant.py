"""Pydantic schemas for Tenant API."""

from pydantic import BaseModel, Field


class TenantCreateRequest(BaseModel):
    """Request body for POST /tenants."""

    code: str = Field(..., min_length=1, max_length=64)
    name: str = Field(..., min_length=1, max_length=255)
    status: str = Field(default="active", pattern="^(active|suspended|archived)$")


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
