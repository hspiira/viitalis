"""User and auth DTOs."""

from dataclasses import dataclass


@dataclass
class UserResult:
    id: str
    tenant_id: str
    username: str
    email: str | None
    is_active: bool


@dataclass
class LoginRequest:
    tenant_code: str
    username: str
    password: str
