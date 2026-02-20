"""Tenant service: create (with admin + generated password), get, list."""

from __future__ import annotations

import secrets
import string
from typing import TYPE_CHECKING

from app.application.dtos.tenant import TenantCreate, TenantCreationResult, TenantResult
from app.domain.enums import TenantStatus
from app.domain.exceptions import ResourceNotFoundException, ValidationException
from app.infrastructure.security.password import hash_password

if TYPE_CHECKING:
    from app.application.interfaces.repositories import ITenantRepository
    from app.infrastructure.persistence.repositories.app_module_repo import (
        AppModuleRepository,
    )
    from app.infrastructure.persistence.repositories.app_permission_repo import (
        AppPermissionRepository,
    )
    from app.infrastructure.persistence.repositories.app_user_repo import (
        AppUserRepository,
    )


class TenantService:
    """Tenant use cases. Create always creates tenant + admin user with generated password and full permissions."""

    def __init__(
        self,
        tenant_repo: ITenantRepository,
        user_repo: AppUserRepository | None = None,
        module_repo: AppModuleRepository | None = None,
        permission_repo: AppPermissionRepository | None = None,
    ) -> None:
        self.tenant_repo = tenant_repo
        self.user_repo = user_repo
        self.module_repo = module_repo
        self.permission_repo = permission_repo

    async def create_tenant(self, data: TenantCreate) -> TenantCreationResult:
        """Create a tenant and an admin user with a generated password and full permissions on all active modules."""
        if data.status not in TenantStatus.values():
            raise ValidationException(
                f"Invalid status: {data.status}. Must be one of {TenantStatus.values()}",
                field="status",
            )
        existing = await self.tenant_repo.get_by_code(data.code.strip())
        if existing:
            raise ValidationException(
                "A tenant with this code already exists",
                field="code",
            )
        if not (self.user_repo and self.module_repo and self.permission_repo):
            raise ValidationException(
                "Tenant creation requires user, module and permission repositories",
                field=None,
            )
        tenant = await self.tenant_repo.create(data)

        admin_username = "admin"
        admin_email = f"admin@{data.code}.vitalis"
        password = self._generate_secure_password()
        password_hash = hash_password(password)
        user = await self.user_repo.create(
            tenant_id=tenant.id,
            username=admin_username,
            email=admin_email,
            password_hash=password_hash,
        )
        modules = await self.module_repo.list_all(status="active")
        for mod in modules:
            await self.permission_repo.create(
                user.id,
                mod.id,
                can_view=True,
                can_create=True,
                can_edit=True,
                can_delete=True,
                can_approve=True,
            )

        return TenantCreationResult(
            tenant_id=tenant.id,
            tenant_code=tenant.code,
            tenant_name=tenant.name,
            admin_username=admin_username,
            admin_email=admin_email,
            admin_initial_password=password,
        )

    @staticmethod
    def _generate_secure_password(length: int = 16) -> str:
        """Generate cryptographically secure password with guaranteed complexity."""
        special = "!@#$%^&*-_=+"
        alphabet = string.ascii_letters + string.digits + special
        rng = secrets.SystemRandom()
        chars = [
            rng.choice(string.ascii_lowercase),
            rng.choice(string.ascii_uppercase),
            rng.choice(string.digits),
            rng.choice(special),
        ]
        remaining = max(0, length - 4)
        chars.extend(rng.choice(alphabet) for _ in range(remaining))
        rng.shuffle(chars)
        return "".join(chars)

    async def get_by_id(self, tenant_id: str) -> TenantResult:
        """Get tenant by ID. Raises ResourceNotFoundException if not found."""
        tenant = await self.tenant_repo.get_by_id(tenant_id)
        if not tenant:
            raise ResourceNotFoundException("Tenant not found")
        return tenant

    async def list_tenants(self, skip: int = 0, limit: int = 100) -> list[TenantResult]:
        """List tenants with pagination."""
        return await self.tenant_repo.list_all(skip=skip, limit=limit)
