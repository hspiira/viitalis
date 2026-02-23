"""Pydantic schemas for Auth API."""

from datetime import datetime

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    tenant_code: str = Field(..., min_length=1)
    username: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class MeResponse(BaseModel):
    """Current user with optional profile detail."""
    id: str
    tenant_id: str
    username: str
    email: str | None
    is_active: bool
    full_name: str | None = None
    phone: str | None = None
    avatar_url: str | None = None
    remarks: str | None = None


class MeUpdateRequest(BaseModel):
    """Update current user profile detail."""
    full_name: str | None = Field(None, max_length=255)
    phone: str | None = Field(None, max_length=64)
    avatar_url: str | None = Field(None, max_length=512)
    remarks: str | None = None


class PermissionResponse(BaseModel):
    """User permission for a module."""
    id: str
    user_id: str
    module_id: str
    module_code: str
    module_name: str
    can_view: bool
    can_create: bool
    can_edit: bool
    can_delete: bool
    can_approve: bool


class AppModuleResponse(BaseModel):
    """Application module (global)."""
    id: str
    code: str
    name: str
    parent_id: str | None
    module_order: int
    status: str


class UserLogResponse(BaseModel):
    """User action log entry."""
    id: str
    user_id: str
    tenant_id: str
    action: str
    module: str | None
    entity_id: str | None
    ip: str | None
    details: str | None
    created_at: datetime
