"""Auth service: login (tenant_code + username + password -> JWT)."""

from __future__ import annotations

from typing import TYPE_CHECKING

from app.application.dtos.user import UserResult
from app.domain.exceptions import ValidationException
from app.infrastructure.security.jwt import create_access_token
from app.infrastructure.security.password import verify_password

if TYPE_CHECKING:
    from app.infrastructure.persistence.repositories.app_user_repo import (
        AppUserRepository,
    )
    from app.infrastructure.persistence.repositories.tenant_repo import (
        TenantRepository,
    )


class AuthService:
    def __init__(
        self,
        tenant_repo: TenantRepository,
        user_repo: AppUserRepository,
    ) -> None:
        self.tenant_repo = tenant_repo
        self.user_repo = user_repo

    async def login(
        self, tenant_code: str, username: str, password: str
    ) -> tuple[str, UserResult]:
        """Validate credentials and return (access_token, user). Raises on failure."""
        if not tenant_code or not tenant_code.strip():
            raise ValidationException("Tenant code is required", field="tenant_code")
        if not username or not username.strip():
            raise ValidationException("Username is required", field="username")
        if not password:
            raise ValidationException("Password is required", field="password")
        tenant = await self.tenant_repo.get_by_code(tenant_code)
        if not tenant:
            raise ValidationException("Invalid tenant code or password")
        pair = await self.user_repo.get_by_tenant_and_username(
            tenant.id, username.strip()
        )
        if not pair:
            raise ValidationException("Invalid tenant code or password")
        user, password_hash = pair
        if not verify_password(password, password_hash):
            raise ValidationException("Invalid tenant code or password")
        token = create_access_token(
            data={"sub": user.id, "tenant_id": user.tenant_id, "username": user.username}
        )
        return token, user
