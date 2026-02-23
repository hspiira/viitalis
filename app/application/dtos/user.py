"""User and auth DTOs."""

from dataclasses import dataclass
from datetime import datetime


@dataclass
class UserResult:
    id: str
    tenant_id: str
    username: str
    email: str | None
    is_active: bool


@dataclass
class UserDetailResult:
    id: str
    user_id: str
    full_name: str | None
    phone: str | None
    avatar_url: str | None
    remarks: str | None


@dataclass
class UserWithDetailResult:
    """User plus optional profile detail."""
    id: str
    tenant_id: str
    username: str
    email: str | None
    is_active: bool
    full_name: str | None = None
    phone: str | None = None
    avatar_url: str | None = None
    remarks: str | None = None


@dataclass
class UserDetailCreate:
    user_id: str
    full_name: str | None = None
    phone: str | None = None
    avatar_url: str | None = None
    remarks: str | None = None


@dataclass
class UserDetailUpdate:
    full_name: str | None = None
    phone: str | None = None
    avatar_url: str | None = None
    remarks: str | None = None


@dataclass
class LoginRequest:
    tenant_code: str
    username: str
    password: str


# --- User log (append-only) ---
@dataclass
class AppUserLogCreate:
    user_id: str
    tenant_id: str
    action: str
    module: str | None = None
    entity_id: str | None = None
    ip: str | None = None
    details: str | None = None


@dataclass
class AppUserLogResult:
    id: str
    user_id: str
    tenant_id: str
    action: str
    module: str | None
    entity_id: str | None
    ip: str | None
    details: str | None
    created_at: datetime


# --- App module ---
@dataclass
class AppModuleResult:
    id: str
    code: str
    name: str
    parent_id: str | None
    module_order: int
    status: str


# --- App permission ---
@dataclass
class AppPermissionResult:
    id: str
    user_id: str
    module_id: str
    can_view: bool
    can_create: bool
    can_edit: bool
    can_delete: bool
    can_approve: bool


@dataclass
class PermissionWithModuleResult:
    """Permission with module code/name for API."""
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
